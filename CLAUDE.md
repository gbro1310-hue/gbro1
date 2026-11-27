# Ordinary Lives — standing workflow

YouTube channel "Ordinary Lives" (@ordinarylivesshow, `UCLf4TvQz2Y-BOszEhhiN7Jw`): immersive second-person history of daily life.

## When the owner says «делай» (do it)

Run the whole pipeline without asking:

1. **Idea + script from vidIQ.** Use vidIQ (`youtube_video_idea`, `keyword_research`, `outliers`, `before_scripts_outlines_and_edits`, `before_stating_script_length`) for the topic and the script. If vidIQ has no credits, use its free script tools and write to its guidance; say so in the report.
2. **Voice:** ALWAYS and only the channel ElevenLabs voice `OEHTkiHZj6OczWZHu0Aj`, model `eleven_multilingual_v2` (through the proxy, `/with-timestamps`, speed .85). Never another voice.
3. **Animation:** made by Claude with Lemo-Opuscar (`/root/lemo-opuscar`). Copy the nearest previous project (e.g. `candle/` for a vertical Short, `apprentice/` for a long video) and adapt. Long renders run detached (`setsid nohup … & disown`) with a watcher.
4. **QC:** duration, −14 LUFS, a contact sheet; send the owner a 540p preview.
5. **Metadata from vidIQ:** title, description, hashtags, tags (`generate_titles`, `score_title`, etc.). Without credits, write them in `<project>/METADATA.md` and say so.
6. **Schedule through vidIQ** (`video_upload` → `social_post_draft_create` → `social_post_publish`):
   - if no video is already scheduled for today → today; otherwise → tomorrow;
   - time: what vidIQ (`subscriber_insights`) recommends; fallback 14:30 UTC (17:30 Moscow), Shorts in the morning (07:00 UTC, 10:00 Moscow) when a long video is already that day;
   - the time must still be in the future when publishing (check `date -u` first);
   - public, category 27, English;
   - «делай» counts as approval to schedule; report links and times afterwards.
7. Do NOT reschedule an already scheduled YouTube video through vidIQ: it uploads a duplicate copy. Ask the owner to change it in YouTube Studio instead.

Commit the project folder (sources, not mp4) to the working branch.
