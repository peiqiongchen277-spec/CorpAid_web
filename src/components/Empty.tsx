import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Empty component
export function Empty() {
  return (
    <div className={cn("flex h-full items-center justify-center p-8 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer")} onClick={() => toast('该功能正在开发中，敬请期待')}>
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">📊</span>
        </div>
        <h3 className="text-gray-400 text-lg mb-2">暂无数据</h3>
        <p className="text-gray-500 text-sm">该功能正在开发中，敬请期待</p>
      </div>
    </div>
  );
}