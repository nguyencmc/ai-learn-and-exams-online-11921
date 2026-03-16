import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logger } from '@/lib/logger';
import type { Profile } from '../types';

const log = logger('Settings');

export function useSettings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
      } else {
        // Create profile if doesn't exist
        const newProfile = {
          user_id: user!.id,
          email: user!.email,
          full_name: user!.user_metadata?.full_name || "",
          username: user!.email?.split("@")[0] || "",
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;
        
        setProfile(createdProfile);
        setFullName(createdProfile.full_name || "");
        setUsername(createdProfile.username || "");
      }
    } catch (error) {
      log.error('Error fetching profile', error);
      toast.error("Không thể tải thông tin tài khoản");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate, fetchProfile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    // Validate file type
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      toast.error("Chỉ chấp nhận file ảnh (jpg, png, gif, webp)");
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước ảnh tối đa là 2MB");
      return;
    }
    
    setUploading(true);
    
    try {
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Delete old avatar if exists
      if (avatarUrl && avatarUrl.includes('avatars')) {
        const oldPath = avatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }
      
      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      setAvatarUrl(publicUrl);
      toast.success("Đã tải ảnh lên thành công!");
    } catch (error) {
      log.error('Error uploading avatar', error);
      toast.error("Không thể tải ảnh lên");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !avatarUrl) return;
    
    try {
      // Delete from storage if it's our storage
      if (avatarUrl.includes('avatars')) {
        const oldPath = avatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }
      
      setAvatarUrl("");
      toast.success("Đã xóa ảnh đại diện");
    } catch (error) {
      log.error('Error removing avatar', error);
      toast.error("Không thể xóa ảnh");
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    // Validate username
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("Username chỉ được chứa chữ cái, số và dấu gạch dưới");
      return;
    }

    setSaving(true);
    try {
      // Check if username is taken by another user
      if (username && username !== profile.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .neq('user_id', user.id)
          .single();

        if (existingUser) {
          toast.error("Username này đã được sử dụng");
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          username: username.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("Đã lưu thông tin thành công!");
      
      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        full_name: fullName.trim() || null,
        username: username.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      } : null);
    } catch (error) {
      log.error('Error saving profile', error);
      toast.error("Không thể lưu thông tin");
    } finally {
      setSaving(false);
    }
  };

  return {
    user,
    authLoading,
    loading,
    saving,
    uploading,
    profile,
    fullName,
    setFullName,
    username,
    setUsername,
    bio,
    setBio,
    avatarUrl,
    handleAvatarUpload,
    handleRemoveAvatar,
    handleSave,
    navigate,
  };
}
