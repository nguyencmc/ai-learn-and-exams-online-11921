import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

export function FlashcardCompletion() {
  return (
    <Card className="mt-6 bg-green-50 border-green-500 dark:bg-green-950/20">
      <CardContent className="py-6 text-center">
        <Check className="w-12 h-12 mx-auto text-green-600 mb-4" />
        <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
          Xuất sắc! Bạn đã nhớ tất cả các thẻ!
        </h3>
        <p className="text-green-600 dark:text-green-500">
          Hãy tiếp tục ôn luyện để ghi nhớ lâu hơn
        </p>
      </CardContent>
    </Card>
  );
}
