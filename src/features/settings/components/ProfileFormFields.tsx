import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, AtSign, Mail, FileText } from "lucide-react";

interface ProfileFormFieldsProps {
  fullName: string;
  onFullNameChange: (value: string) => void;
  username: string;
  onUsernameChange: (value: string) => void;
  email: string;
  bio: string;
  onBioChange: (value: string) => void;
}

export function ProfileFormFields({
  fullName,
  onFullNameChange,
  username,
  onUsernameChange,
  email,
  bio,
  onBioChange,
}: ProfileFormFieldsProps) {
  return (
    <>
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Họ và tên
        </Label>
        <Input
          id="fullName"
          placeholder="Nguyễn Văn A"
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Username Field */}
      <div className="space-y-2">
        <Label htmlFor="username" className="flex items-center gap-2">
          <AtSign className="w-4 h-4" />
          Username
        </Label>
        <Input
          id="username"
          placeholder="username"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          maxLength={30}
        />
        <p className="text-xs text-muted-foreground">
          Trang cá nhân của bạn: /@{username || 'username'}
        </p>
      </div>

      {/* Email Field (Read Only) */}
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Email không thể thay đổi
        </p>
      </div>

      {/* Bio Field */}
      <div className="space-y-2">
        <Label htmlFor="bio" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Giới thiệu bản thân
        </Label>
        <Textarea
          id="bio"
          placeholder="Viết vài dòng giới thiệu về bạn..."
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          maxLength={500}
          rows={4}
        />
        <p className="text-xs text-muted-foreground text-right">
          {bio.length}/500 ký tự
        </p>
      </div>
    </>
  );
}
