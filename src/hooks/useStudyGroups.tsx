import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { logger } from '@/lib/logger';

const log = logger('useStudyGroups');

export interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  creator_id: string;
  is_public: boolean;
  max_members: number;
  member_count: number;
  category: string;
  created_at: string;
}

export interface StudyGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  profile?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface StudyGroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface StudyGroupResource {
  id: string;
  group_id: string;
  user_id: string;
  title: string;
  description: string | null;
  resource_type: 'link' | 'file' | 'note' | 'exam' | 'flashcard';
  resource_url: string | null;
  resource_id: string | null;
  created_at: string;
}

export const useStudyGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      log.error('Error fetching groups', error);
    }
  };

  const fetchMyGroups = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('study_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (memberData && memberData.length > 0) {
        const groupIds = memberData.map(m => m.group_id);
        const { data: groupsData, error: groupsError } = await supabase
          .from('study_groups')
          .select('*')
          .in('id', groupIds)
          .order('created_at', { ascending: false });

        if (groupsError) throw groupsError;
        setMyGroups(groupsData || []);
      } else {
        setMyGroups([]);
      }
    } catch (error) {
      log.error('Error fetching my groups', error);
    }
  }, [user]);

  const createGroup = async (name: string, description: string, category: string, isPublic: boolean) => {
    if (!user) {
      toast.error('Bạn cần đăng nhập để tạo nhóm');
      return null;
    }

    try {
      const { data: groupData, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          name,
          description,
          category,
          is_public: isPublic,
          creator_id: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('study_group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      toast.success('Tạo nhóm thành công!');
      await fetchGroups();
      await fetchMyGroups();
      return groupData;
    } catch (error: unknown) {
      log.error('Error creating group', error);
      toast.error('Không thể tạo nhóm: ' + getErrorMessage(error));
      return null;
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) {
      toast.error('Bạn cần đăng nhập để tham gia nhóm');
      return false;
    }

    try {
      const { error } = await supabase
        .from('study_group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;

      toast.success('Đã tham gia nhóm!');
      await fetchMyGroups();
      return true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        toast.error('Bạn đã là thành viên của nhóm này');
      } else {
        toast.error('Không thể tham gia nhóm');
      }
      return false;
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('study_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Đã rời nhóm');
      await fetchMyGroups();
      return true;
    } catch {
      toast.error('Không thể rời nhóm');
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchGroups(), fetchMyGroups()]);
      setLoading(false);
    };
    loadData();
  }, [user, fetchMyGroups]);

  return {
    groups,
    myGroups,
    loading,
    createGroup,
    joinGroup,
    leaveGroup,
    refreshGroups: () => Promise.all([fetchGroups(), fetchMyGroups()]),
  };
};

export const useStudyGroupDetail = (groupId: string) => {
  const { user } = useAuth();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [members, setMembers] = useState<StudyGroupMember[]>([]);
  const [messages, setMessages] = useState<StudyGroupMessage[]>([]);
  const [resources, setResources] = useState<StudyGroupResource[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGroup = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      setGroup(data);
    } catch (error) {
      log.error('Error fetching group', error);
    }
  }, [groupId]);

  const fetchMembers = useCallback(async () => {
    try {
      const { data: membersData, error } = await supabase
        .from('study_group_members')
        .select('*')
        .eq('group_id', groupId);

      if (error) throw error;

      // Fetch profiles for members
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url')
          .in('user_id', userIds);

        const membersWithProfiles = membersData.map(member => ({
          ...member,
          role: member.role as 'owner' | 'admin' | 'member',
          profile: profiles?.find(p => p.user_id === member.user_id),
        }));

        setMembers(membersWithProfiles);

        if (user) {
          const currentMember = membersData.find(m => m.user_id === user.id);
          setIsMember(!!currentMember);
          setUserRole(currentMember?.role || null);
        }
      }
    } catch (error) {
      log.error('Error fetching members', error);
    }
  }, [groupId, user]);

  const fetchMessages = useCallback(async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from('study_group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (messagesData && messagesData.length > 0) {
        const userIds = [...new Set(messagesData.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url')
          .in('user_id', userIds);

        const messagesWithProfiles = messagesData.map(msg => ({
          ...msg,
          profile: profiles?.find(p => p.user_id === msg.user_id),
        }));

        setMessages(messagesWithProfiles);
      } else {
        setMessages([]);
      }
    } catch (error) {
      log.error('Error fetching messages', error);
    }
  }, [groupId]);

  const fetchResources = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('study_group_resources')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources((data || []).map(r => ({
        ...r,
        resource_type: r.resource_type as 'link' | 'file' | 'note' | 'exam' | 'flashcard',
      })));
    } catch (error) {
      log.error('Error fetching resources', error);
    }
  }, [groupId]);

  const sendMessage = async (content: string) => {
    if (!user || !isMember) return false;

    try {
      const { error } = await supabase
        .from('study_group_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      log.error('Error sending message', error);
      return false;
    }
  };

  const addResource = async (title: string, description: string, resourceType: string, resourceUrl?: string) => {
    if (!user || !isMember) return false;

    try {
      const { error } = await supabase
        .from('study_group_resources')
        .insert({
          group_id: groupId,
          user_id: user.id,
          title,
          description,
          resource_type: resourceType,
          resource_url: resourceUrl,
        });

      if (error) throw error;
      await fetchResources();
      toast.success('Đã thêm tài liệu!');
      return true;
    } catch (error) {
      log.error('Error adding resource', error);
      toast.error('Không thể thêm tài liệu');
      return false;
    }
  };

  // Subscribe to realtime messages
  useEffect(() => {
    if (!isMember) return;

    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'study_group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const newMessage = payload.new as StudyGroupMessage;
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, full_name, username, avatar_url')
            .eq('user_id', newMessage.user_id)
            .single();

          setMessages(prev => [...prev, { ...newMessage, profile }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, isMember]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchGroup(), fetchMembers()]);
      setLoading(false);
    };
    loadData();
  }, [groupId, user, fetchGroup, fetchMembers]);

  useEffect(() => {
    if (isMember) {
      fetchMessages();
      fetchResources();
    }
  }, [isMember, fetchMessages, fetchResources]);

  return {
    group,
    members,
    messages,
    resources,
    isMember,
    userRole,
    loading,
    sendMessage,
    addResource,
    refreshData: () => Promise.all([fetchGroup(), fetchMembers(), fetchMessages(), fetchResources()]),
  };
};
