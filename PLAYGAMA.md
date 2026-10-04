# Corporate Capital — Playgama Submission Copy

The store-listing copy for **Corporate Capital**, kept verbatim so it can be
pasted into the Playgama submission form. For everything about the codebase, see
the [README](./README.md).

## Game description

Corporate Capital is a satirical idle/clicker game about grinding your way up the corporate ladder, one soul-crushing customer service ticket at a time. Mash keys to draft replies, fire off canned corporate jargon, and watch the tickets pile up. Reinvest your earnings into upgrades, outsource your job to overseas agents, then replace them with an AI chatbot; because nothing says "synergy" like automating yourself out of relevance. Get promoted, start the grind over as HR, deny leave requests, deploy HR bots, then fire your own middle managers and do it all again. It's an incremental clicker with a dark corporate-satire twist: the more efficient you get, the less anyone (including you) is actually needed.

## How to play

Climb the corporate ladder by resolving tickets, earning Corporate Capital, and buying upgrades and milestones until you can accept a promotion; then do it all again in a new, more absurd role. There's no traditional "win," just an ever-escalating loop of automation and promotion.

## Controls

**Desktop**

| Input | Action |
| --- | --- |
| Any letter / number / space key | Type out a reply to the active ticket |
| Enter | Send the reply once it's ready (or add a keystroke if it isn't) |
| Mouse click | Buy upgrades and milestones, use canned response buttons, mute/unmute audio |

**Mobile**

| Input | Action |
| --- | --- |
| On-screen keyboard | Tap any key to draft your reply |
| Tap | Send button, canned response buttons, upgrade/milestone purchases |
| Tab bar | Switch between the Queue, Dashboard, and Upgrades panels |

## Audio cues

| File | Fired by | Suggested feel | Length |
| --- | --- | --- | --- |
| `lose.mp3` | `audio.lose()` | Reserved for setback/negative event — descending sad trombone-ish tone | ~0.8–1.2s |
| `win.mp3` | `audio.win()` | Milestone purchased, big ad reward — triumphant fanfare/jingle | ~1–1.5s |
| `clutch.mp3` | `audio.clutch()` | Upgrade purchased — satisfying "cha-ching"/purchase confirm | ~0.3–0.5s |
| `correct.mp3` | `audio.correct()` | Reply sent successfully, ad reward claimed — bright positive "ding"/chime | ~0.5–0.8s |
| `select.mp3` | `audio.select()` | Canned-response button used — snappy UI select/confirm blip | ~0.2–0.3s |
| `countdown.mp3` | `audio.countdown()` | Reserved for timer/urgency cue — sharp tick/beep | ~0.15–0.25s |