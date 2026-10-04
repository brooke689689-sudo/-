"use client";

import { deletePost } from "../actions";

export function DeletePostButton({ postId }: { postId: string }) {
  return (
    <form
      action={deletePost}
      onSubmit={(e) => {
        if (!confirm("이 분양글을 삭제할까요? 삭제한 글은 되돌릴 수 없어요. 진행 중인 채팅방은 그대로 남아요.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="post" value={postId} />
      <button type="submit" className="rounded-lg px-3 py-1.5 font-semibold text-red-500 hover:bg-red-50">
        삭제
      </button>
    </form>
  );
}
