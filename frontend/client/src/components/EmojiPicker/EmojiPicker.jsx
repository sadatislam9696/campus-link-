import { useEffect, useRef, useState } from "react";
import "./EmojiPicker.css";

// A curated common set rather than a full unicode emoji library - keeps
// the bundle tiny and covers the vast majority of what people actually
// reach for in casual comments/posts.
const EMOJIS = [
  "😀", "😂", "🥰", "😍", "😎", "🤔", "😅", "😢",
  "😭", "😡", "🥳", "😴", "🤗", "😇", "🙃", "😉",
  "👍", "👎", "👏", "🙌", "🙏", "💪", "🤝", "👋",
  "❤️", "🔥", "🎉", "✨", "⭐", "💯", "✅", "❌",
  "😮", "😱", "🤯", "🥲", "😬", "🤩", "🥹", "😏",
  "📚", "💻", "☕", "🎓", "📌", "🚀", "💡", "🙈",
];

function EmojiPicker({ onSelect }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="emoji-popover-wrap" ref={wrapRef}>
      <button
        type="button"
        className="emoji-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Add emoji"
      >
        😊
      </button>

      {open && (
        <div className="emoji-popover">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default EmojiPicker;
