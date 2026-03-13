import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Layers, 
  Plus,
  ArrowLeft,
  Save,
  Trash2,
  GripVertical
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/hooks/useAuditLogs';
import { getErrorMessage } from '@/lib/utils';

interface Flashcard {
  id?: string;
  front_text: string;
  back_text: string;
  card_order: number;
}

const FlashcardEditor = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const { user } = useAuth();
  const { isAdmin, hasPermission, loading: roleLoading } = usePermissionsContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Set fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [isPublic, setIsPublic] = useState(true);
  
  // Cards
  const [cards, setCards] = useState<Flashcard[]>([]);

  const canCreate = hasPermission('flashcards.create');
  const canEdit = hasPermission('flashcards.edit');
  const hasAccess = isEditing ? canEdit : canCreate;

  useEffect(() => {
    if (!roleLoading && !hasAccess) {
      navigate('/');
    }
  }, [hasAccess, roleLoading, navigate]);

  useEffect(() => {
    if (isEditing) {
      fetchSet();
    }
  }, [id]);

  const fetchSet = async () => {
    setLoading(true);
    
    const { data: set, error } = await supabase
      .from('flashcard_sets')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !set) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy bộ thẻ",
        variant: "destructive",
      });
      navigate('/admin/flashcards');
      return;
    }

    setTitle(set.title);
    setDescription(set.description || '');
    setCategory(set.category || 'general');
    setIsPublic(set.is_public ?? true);

    // Fetch cards
    const { data: cardsData } = await supabase
      .from('flashcards')
      .select('*')
      .eq('set_id', id)
      .order('card_order', { ascending: true });

    setCards(cardsData || []);
    setLoading(false);
  };

  const addCard = () => {
    setCards([
      ...cards,
      {
        front_text: '',
        back_text: '',
        card_order: cards.length + 1,
      },
    ]);
  };

  const updateCard = (index: number, field: keyof Flashcard, value: string | number) => {
    const updated = [...cards];
    (updated[index] as Record<string, string | number>)[field] = value;
    setCards(updated);
  };

  const removeCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      let setId = id;

      if (isEditing) {
        const { error } = await supabase
          .from('flashcard_sets')
          .update({
            title,
            description: description || null,
            category,
            is_public: isPublic,
            card_count: cards.length,
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('flashcard_sets')
          .insert({
            title,
            description: description || null,
            category,
            is_public: isPublic,
            card_count: cards.length,
            creator_id: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        setId = data.id;
      }

      // Handle cards
      if (isEditing) {
        await supabase.from('flashcards').delete().eq('set_id', setId);
      }

      if (cards.length > 0) {
        const cardsToInsert = cards.map((c, index) => ({
          set_id: setId,
          front_text: c.front_text,
          back_text: c.back_text,
          card_order: index + 1,
        }));

        const { error: cardsError } = await supabase
          .from('flashcards')
          .insert(cardsToInsert);

        if (cardsError) throw cardsError;
      }

      // Create audit log
      await createAuditLog(
        isEditing ? 'update' : 'create',
        'flashcard_set',
        setId,
        isEditing ? { title, category, card_count: cards.length } : null,
        { title, category, card_count: cards.length, is_public: isPublic }
      );

      toast({
        title: "Thành công",
        description: isEditing ? "Đã cập nhật bộ thẻ" : "Đã tạo bộ thẻ mới",
      });

      navigate('/admin/flashcards');
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error) || "Không thể lưu bộ thẻ",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
<div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin/flashcards">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Layers className="w-8 h-8 text-orange-500" />
                {isEditing ? 'Chỉnh sửa bộ thẻ' : 'Tạo bộ thẻ mới'}
              </h1>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu bộ thẻ'}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Set Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Thông tin bộ thẻ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Tiêu đề *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề bộ thẻ"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả về bộ thẻ"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Danh mục</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Chung</SelectItem>
                      <SelectItem value="languages">Ngôn ngữ</SelectItem>
                      <SelectItem value="science">Khoa học</SelectItem>
                      <SelectItem value="math">Toán học</SelectItem>
                      <SelectItem value="history">Lịch sử</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is-public">Công khai</Label>
                  <Switch
                    id="is-public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Thẻ ({cards.length})</h2>
              <Button onClick={addCard} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Thêm thẻ
              </Button>
            </div>

            {cards.length === 0 ? (
              <Card className="border-border/50 border-dashed">
                <CardContent className="py-12 text-center">
                  <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Chưa có thẻ nào</p>
                  <Button onClick={addCard}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm thẻ đầu tiên
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {cards.map((card, index) => (
                  <Card key={index} className="border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <CardTitle className="text-base">Thẻ {index + 1}</CardTitle>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa thẻ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={() => removeCard(index)}>
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Mặt trước *</Label>
                          <Textarea
                            value={card.front_text}
                            onChange={(e) => updateCard(index, 'front_text', e.target.value)}
                            placeholder="Từ vựng, câu hỏi..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Mặt sau *</Label>
                          <Textarea
                            value={card.back_text}
                            onChange={(e) => updateCard(index, 'back_text', e.target.value)}
                            placeholder="Nghĩa, đáp án..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FlashcardEditor;
