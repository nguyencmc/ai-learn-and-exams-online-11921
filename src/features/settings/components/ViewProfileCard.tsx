import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ViewProfileCardProps {
  username: string;
  onNavigate: (path: string) => void;
}

export function ViewProfileCard({ username, onNavigate }: ViewProfileCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Xem trang cá nhân</p>
            <p className="text-sm text-muted-foreground">Xem hồ sơ công khai của bạn</p>
          </div>
          <Button variant="outline" onClick={() => onNavigate(`/@${username}`)}>
            Xem hồ sơ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
