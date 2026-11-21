import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, safe, safeCenterX, springs, textStroke } from "../theme";
import { ChatBubbles, ChatMessage } from "./ChatBubble";

/**
 * «Выскакивающие» мем-вставки. Используй 2–4 на ролик.
 * Все тайминги — в секундах абсолютного времени ролика (кадр родителя / fps).
 */
type Base = { atSec: number; durSec?: number; x?: number; y?: number };

export type MemeProps =
  | (Base & { type: "text"; text: string; angle?: number })
  | (Base & { type: "sticker"; emoji: string; size?: number })
  | (Base & { type: "push"; app?: string; title: string; text: string; icon?: string })
  | (Base & { type: "chat"; messages: ChatMessage[] })
  | (Base & { type: "notAd"; text?: string });

const useLife = (atSec: number, durSec: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - atSec * fps;
  const inP = spring({ frame: local, fps, config: springs.pop });
  const outP = spring({ frame: local - (durSec * fps - 8), fps, config: { damping: 200 }, durationInFrames: 8 });
  return { local, fps, inP, outP, visible: local >= 0 && local < durSec * fps + 2 };
};

export const MemePopup: React.FC<MemeProps> = (props) => {
  const dur = props.durSec ?? (props.type === "chat" ? 2.6 : props.type === "push" ? 2.2 : 1.4);
  const { local, inP, outP, visible } = useLife(props.atSec, dur);
  if (!visible) return null;

  if (props.type === "text") {
    const angle = props.angle ?? -6;
    return (
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: (props.x ?? safeCenterX) - 400,
            top: props.y ?? 520,
            width: 800,
            display: "flex",
            justifyContent: "center",
            translate: `${interpolate(inP, [0, 1], [-700, 0]) + interpolate(outP, [0, 1], [0, 900])}px 0`,
            rotate: `${interpolate(inP, [0, 1], [angle * 4, angle])}deg`,
          }}
        >
          <div
            style={{
              background: colors.yellow,
              color: "#111",
              padding: "28px 40px",
              borderRadius: 22,
              fontFamily: fonts.heading,
              fontWeight: 900,
              fontSize: 54,
              lineHeight: 1.12,
              textAlign: "center",
              whiteSpace: "pre-line",
              boxShadow: "0 24px 60px rgba(0,0,0,0.55), 0 0 0 6px #111",
            }}
          >
            {props.text}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (props.type === "sticker") {
    const size = props.size ?? 260;
    return (
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: (props.x ?? safeCenterX + 230) - size / 2,
            top: (props.y ?? 560) - size / 2,
            fontSize: size,
            lineHeight: 1,
            fontFamily: fonts.emoji,
            scale: interpolate(inP, [0, 1], [0, 1]) * interpolate(outP, [0, 1], [1, 0]),
            rotate: `${interpolate(inP, [0, 1], [-200, 12]) + Math.sin(local / 6) * 4}deg`,
            filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))",
          }}
        >
          {props.emoji}
        </div>
      </AbsoluteFill>
    );
  }

  if (props.type === "push") {
    return (
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: safe.left,
            width: 1080 - safe.left - safe.right,
            top: props.y ?? safe.top + 10,
            translate: `0 ${interpolate(inP, [0, 1], [-420, 0]) + interpolate(outP, [0, 1], [0, -420])}px`,
            background: "rgba(40,40,48,0.92)",
            borderRadius: 44,
            padding: "28px 34px",
            display: "flex",
            gap: 26,
            alignItems: "center",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: colors.green,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 58,
              fontFamily: fonts.emoji,
              flexShrink: 0,
            }}
          >
            {props.icon ?? "💬"}
          </div>
          <div style={{ fontFamily: fonts.body, color: colors.text, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: colors.muted }}>
              <span>{(props.app ?? "Сообщения").toUpperCase()}</span>
              <span>сейчас</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 44, marginTop: 4 }}>{props.title}</div>
            <div style={{ fontWeight: 500, fontSize: 42, marginTop: 2 }}>{props.text}</div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (props.type === "chat") {
    return (
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: (props.x ?? safeCenterX) - 380,
            top: props.y ?? 560,
            opacity: interpolate(outP, [0, 1], [1, 0]),
            translate: `0 ${interpolate(outP, [0, 1], [0, -60])}px`,
          }}
        >
          <ChatBubbles messages={props.messages} />
        </div>
      </AbsoluteFill>
    );
  }

  // notAd — маленькая сноска «*не реклама»
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: props.x ?? safe.left + 10,
          top: props.y ?? safe.top + 20,
          fontFamily: fonts.body,
          fontSize: 30,
          color: colors.muted,
          opacity: interpolate(inP, [0, 1], [0, 0.9]),
          ...textStroke(4),
        }}
      >
        {props.text ?? "*не реклама"}
      </div>
    </AbsoluteFill>
  );
};
