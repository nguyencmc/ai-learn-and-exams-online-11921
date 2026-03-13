import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from '@/lib/utils';
import { logger } from '@/lib/logger';

const log = logger('CourseReviews');
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Star, ThumbsUp, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

interface CourseReviewsProps {
  courseId: string;
  isEnrolled: boolean;
  onRatingUpdate?: (avgRating: number, totalRatings: number) => void;
}

export const CourseReviews = ({ courseId, isEnrolled, onRatingUpdate }: CourseReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  
  // New review form
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [courseId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_reviews")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each review
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, username")
            .eq("user_id", review.user_id)
            .maybeSingle();
          
          return { ...review, profile };
        })
      );

      setReviews(reviewsWithProfiles);
      
      // Find user's existing review
      if (user) {
        const existing = reviewsWithProfiles.find(r => r.user_id === user.id);
        if (existing) {
          setUserReview(existing);
          setNewRating(existing.rating);
          setNewComment(existing.comment || "");
        }
      }

      // Calculate average rating
      if (reviewsWithProfiles.length > 0 && onRatingUpdate) {
        const avgRating = reviewsWithProfiles.reduce((sum, r) => sum + r.rating, 0) / reviewsWithProfiles.length;
        onRatingUpdate(avgRating, reviewsWithProfiles.length);
      }
    } catch (error) {
      log.error("Error fetching reviews", error);
    }
    setLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!user || newRating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    setSubmitting(true);
    try {
      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from("course_reviews")
          .update({
            rating: newRating,
            comment: newComment.trim() || null,
          })
          .eq("id", userReview.id);

        if (error) throw error;
        toast.success("Đã cập nhật đánh giá");
      } else {
        // Create new review
        const { error } = await supabase
          .from("course_reviews")
          .insert({
            course_id: courseId,
            user_id: user.id,
            rating: newRating,
            comment: newComment.trim() || null,
          });

        if (error) throw error;
        toast.success("Đã gửi đánh giá của bạn");
      }

      setIsEditing(false);
      fetchReviews();
    } catch (error: unknown) {
      log.error("Error submitting review", error);
      toast.error("Không thể gửi đánh giá: " + getErrorMessage(error));
    }
    setSubmitting(false);
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    const confirmed = window.confirm("Bạn có chắc muốn xóa đánh giá này?");
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("course_reviews")
        .delete()
        .eq("id", userReview.id);

      if (error) throw error;
      
      setUserReview(null);
      setNewRating(0);
      setNewComment("");
      toast.success("Đã xóa đánh giá");
      fetchReviews();
    } catch (error: unknown) {
      toast.error("Không thể xóa đánh giá: " + getErrorMessage(error));
    }
  };

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 
      : 0
  }));

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Đánh giá của học viên ({reviews.length})
      </h2>

      {/* Rating Summary */}
      {reviews.length > 0 && (
        <div className="flex flex-col md:flex-row gap-8 mb-6 p-6 bg-card border rounded-xl">
          <div className="text-center md:pr-8 md:border-r">
            <div className="text-5xl font-bold text-yellow-500 mb-1">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">{reviews.length} đánh giá</div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm">{star}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
                <Progress value={percentage} className="flex-1 h-2" />
                <span className="text-sm text-muted-foreground w-8">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write Review Form - Only for enrolled users */}
      {user && isEnrolled && (
        <div className="mb-6 p-6 bg-card border rounded-xl">
          <h3 className="font-semibold mb-4">
            {userReview && !isEditing ? "Đánh giá của bạn" : userReview ? "Chỉnh sửa đánh giá" : "Viết đánh giá"}
          </h3>

          {userReview && !isEditing ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < userReview.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              {userReview.comment && (
                <p className="text-muted-foreground mb-4">{userReview.comment}</p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Chỉnh sửa
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDeleteReview} className="text-destructive">
                  Xóa
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* Star Rating Input */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground mr-2">Đánh giá:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoverRating || newRating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                {newRating > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    {newRating === 1 && "Rất tệ"}
                    {newRating === 2 && "Tệ"}
                    {newRating === 3 && "Bình thường"}
                    {newRating === 4 && "Tốt"}
                    {newRating === 5 && "Tuyệt vời"}
                  </span>
                )}
              </div>

              <Textarea
                placeholder="Chia sẻ trải nghiệm học tập của bạn... (không bắt buộc)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="mb-4"
              />

              <div className="flex gap-2">
                <Button onClick={handleSubmitReview} disabled={submitting || newRating === 0}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang gửi...
                    </>
                  ) : userReview ? (
                    "Cập nhật đánh giá"
                  ) : (
                    "Gửi đánh giá"
                  )}
                </Button>
                {isEditing && (
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    Hủy
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Not enrolled message */}
      {user && !isEnrolled && (
        <div className="mb-6 p-4 bg-muted/50 rounded-xl text-center text-muted-foreground">
          Đăng ký khóa học để có thể viết đánh giá
        </div>
      )}

      {/* Not logged in message */}
      {!user && (
        <div className="mb-6 p-4 bg-muted/50 rounded-xl text-center text-muted-foreground">
          Đăng nhập để xem và viết đánh giá
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Chưa có đánh giá nào cho khóa học này</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <div key={review.id} className="p-4 bg-card border rounded-xl">
              <div className="flex items-start gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={review.profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {(review.profile?.full_name || review.profile?.username || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {review.profile?.full_name || review.profile?.username || "Học viên"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: vi })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {reviews.length > 5 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAllReviews(!showAllReviews)}
            >
              {showAllReviews ? "Thu gọn" : `Xem tất cả ${reviews.length} đánh giá`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
