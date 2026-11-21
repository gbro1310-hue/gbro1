import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, springs } from "../theme";

export type ChatMessage = { text: string; side: "left" | "right"; atSec: number };

/** Переписка: пузыри появляются по одному (как в мессенджере) */
export const ChatBubbles: React.FC<{ messages: ChatMessage[]; width?: number }> = ({
  messages,
  width = 760,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ width, display: "flex", flexDirection: "column", gap: 18 }}>
      {messages.map((m, i) => {
        const p = spring({ frame: frame - m.atSec * fps, fps, config: springs.pop });
        if (frame < m.atSec * fps) return null;
        const right = m.side === "right";
        return (
          <div
            key={i}
            style={{
              alignSelf: right ? "flex-end" : "flex-start",
              maxWidth: width * 0.82,
              padding: "26px 34px",
              borderRadius: 40,
              borderBottomRightRadius: right ? 10 : 40,
              borderBottomLeftRadius: right ? 40 : 10,
              background: right ? "#2F7CF6" : colors.card,
              color: colors.text,
              fontFamily: fonts.body,
              fontWeight: 700,
              fontSize: 46,
              lineHeight: 1.2,
              boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
              scale: interpolate(p, [0, 1], [0.6, 1]),
              opacity: interpolate(p, [0, 1], [0, 1]),
              translate: `0 ${interpolate(p, [0, 1], [40, 0])}px`,
              transformOrigin: right ? "right bottom" : "left bottom",
            }}
          >
            {m.text}
          </div>
        );
      })}
    </div>
  );
};
