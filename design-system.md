# LumoStep V3 design system

Source: [Lumostep lumo ai v3](https://www.figma.com/design/eBKVA7vVtNMuBwFZSRTP2n/Lumostep-lumo-ai-v3). Specs come from the approved screens and the linked components.

Approved screens are the source of truth for default appearance. Component sets supply dimensions and existing variants. Where those disagreed, this document records the decision from the inconsistency review. Do not invent values beyond that review.

Frame width on every approved screen is **375**. Product type is **Lora** and **Nunito Sans**. The status bar is iOS chrome (SF Pro) and is not a product style.

## Color

| Token | Value | Use |
|---|---|---|
| `surface/base` | `#faf8f8` | Welcome, conversation start, and conversation page. Back and more controls. |
| `surface/default` | `#ffffff` | Composer, chat menu. |
| `surface/hover` | `#f5eeeb` | Back and more hover. Aliases `colors/neutral-orange/200`. |
| `surface/subtle` | `#fefbe7` | Same hex as `surface/recommendation`. |
| `surface/recommendation` | `#fefbe7` | Loader dot. |
| `surface/recommendation-card` | `#ffffff` | Recommendation card. The elevated fill below is not used on these variants. |
| `surface/recommendation-card-elevated` | `#faea76` | Defined in Figma. Not applied. |
| `surface/choice-warm` | `#f9ebdd` | “Make my meals healthier” card. |
| `surface/choice-fresh` | `#e4f4e2` | “Cook with my ingredients” card. |
| `colors/neutral-orange/50` | `#fff9f5` | Recipe card. |
| `colors/neutral-orange/100` | `#fbf4f1` | Ingredient chip. Same hex as the disabled send surface. |
| `colors/primary-orange/50` | `#fbf2e0` | User bubble. Selected question chip. |
| `colors/primary-orange/100` | `#fbf4f1` | Secondary pressed fill. |
| `button/surface/primary` | `#ea6c00` | Primary button, active send. |
| `button/surface/disabled` | `#fbf4f1` | Inactive send. |
| `button/pressed` | `#d9770c` | Primary pressed fill. |
| `button/text` | `#ffffff` | Primary label. Same hex as `colors/neutral/0`. |
| `colors/neutral/0` | `#ffffff` | White. |
| `content/primary` | `#26221f` | Titles, AI and user message text, start-card titles. |
| `content/secondary` | `#484340` | Supporting copy, menu labels, recommendation benefit. |
| `content/tertiary` | `#67625f` | Card descriptions, recipe body, ingredient-chip text. |
| `content/disabled` | `#c4beba` | Composer placeholder. |
| `content/on-brand` | `#ea6c00` | Meal eyebrow, wordmark, composer caret. |
| `colors/secondary/600` | `#5e5a45` | “Updating the change” label. |
| `colors/peach/400` | `#f2a46a` | Middle loader dot. |
| `border/subtle` | `#e7e1dd` | Recommendation card. |
| `border/default` | `#f5eeeb` | Bound on the composer. The composer has no border. |
| `border/divider` | `#ededed` | 1px rule inside the recommendation card. |
| `border/button` | `#e9e3d6` | Secondary button border. |
| `border-width/thin` | `0.5` | Photo-remove control. |
| `Neutral/Main(900)` | `#292926` | Status-bar time on conversation screens. |
| `Neutral/Main(800)` | `#3a3a39` | Returned on the conversation screen. Not painted in the product UI. |
| `900` | `#1e2a18` | Returned on the conversation screen. Not painted in the product UI. |

Question chips use a 1px border of `rgba(0,0,0,0.1)`. That value is the approved screen appearance and is not a separate token.

The conversation composer tray is painted `#fcfafa`. It is one screen fill, not a token.

## Typography

Text styles store letter-spacing as `-1.5`. On the approved screens that resolves to **-0.3px at 20px** and **-0.24px at 16px**.

| Token | Spec | Use |
|---|---|---|
| `typography/wordmark` | Lora Bold 40, line-height 1, `content/on-brand` | “lumoStep”, centered, Welcome only. |
| `typography/heading/md` | Lora Medium 20 / 24, spacing -1.5 | “Hi, I’m Lumo!” and recommendation titles. Color `content/primary`. |
| `typography/heading/sm` | Nunito Sans Bold 16 / 20, spacing -1.5 | Not used on these screens. Start-card titles stay Regular. |
| `typography/body/default` | Nunito Sans Regular 16 / 24 | Chat and the start subtitle. |
| `typography/body/sm` | Nunito Sans Regular 14 / 20 | Descriptions, composer, time, benefit, recipe body, question chips. |
| `typography/label` | Nunito Sans Bold 12 / 16 | Eyebrow, ingredient chip, menu rows. |
| `typography/button` | Nunito Sans Medium 16 / 24 | Buttons. |

Start-card titles are Nunito Sans Regular 16 / 20, tracking -0.24px, `content/primary`. That is intentional. Do not apply Bold `typography/heading/sm`.

Local styles that are not tokens:

| Use | Spec |
|---|---|
| “View recipe” / “Hide recipe” | Nunito Sans Medium 12 / 16, `content/primary`. |
| Recipe section titles | Nunito Sans Bold 14 / 20, `content/primary`. |

## Spacing

| Token | Value |
|---|---|
| `spacing/spacing4` | 4 |
| `spacing/space8` and `spacing/spacing8` | 8 |
| `spacing/space12` | 12 |

Repeated layout values that are not extra tokens: 16 page inset, 20 between chat turns, 24 between wordmark and mascot, 26 between the start hero and the two cards, 12 between those cards.

## Radius

| Token | Value | Use |
|---|---|---|
| `radius/tail` | 6 | User bubble, bottom-right only. |
| `radius/xs` | 12 | Composer photo thumbnail. |
| `radius/sm` | 16 | Add control, chat menu. |
| `radius/md` | 24 | Buttons, composer, cards, chips, recipe card. |
| `radius/pill` | 999 | Send, back, and the more control. |
| `radius/radiusfull` | 9999 | Photo-remove control. |

The more control is drawn at radius 20 on a 40px box, which is the same circle as `radius/pill`. The recommendation divider is a 1px line. Its radius 2 is not a token.

## Elevation

| Surface | Shadow |
|---|---|
| Composer | `-4 -4 6 rgba(0,0,0,0.04)` and `4 4 6 rgba(0,0,0,0.04)` |
| Recommendation card | `0 -4 2 rgba(0,0,0,0.02)` and `0 4 2 rgba(0,0,0,0.02)` |
| Primary button inside that card | `0 3 6 rgba(217,119,12,0.12)` |
| Secondary button inside that card | `0 3 12 rgba(233,227,214,0.3)` |
| Chat menu | `0 4 6 rgba(0,0,0,0.04)` |
| Conversation header | `0 2 6 rgba(0,0,0,0.04)`, backdrop blur 10. The back row is blur 10; the status block is blur 5. |
| Secondary pressed, in the button set only | `0 1 6` using `border/button` |

The base button component does not include the card-button shadows. Those shadows belong to the recommendation card on the approved screen.

## Screens

### Welcome — `227:13409`

Page `surface/base`. Mascot **119×85**, then **24**, then `typography/wordmark`. Both centered. Home indicator height **21**.

### Conversation start — `227:13385`

Page `surface/base`. Hero column is **292** wide, gap **12** to the text block. Mascot **113×82**. Title and subtitle gap **4**. Subtitle width **272**. The hero-to-cards gap is **26**.

Two equal cards in a row: inset **16 / 12**, gap **12**, card padding **12**, radius `radius/md`, internal gap **8**.

| Card | Fill | Title | Body |
|---|---|---|---|
| Make my meals healthier | `surface/choice-warm` | Regular 16 / 20, tracking -0.24px, `content/primary` | `typography/body/sm`, `content/tertiary` |
| Cook with my ingredients | `surface/choice-fresh` | same | same |

Illustration crops are **40×35** and **43×35**, radius `radius/md`. Composer sits in a tray with top padding **12** and horizontal padding **12**, in the typed state.

### Conversation — `227:15318`

Page `surface/base`. Header: back and more, each **40**, row padding **8 / 4**. Chat column height **614**, padding **16 / 12**, turn gap **20**, aligned to the end. Thread width **343**. The composer tray is the one-off `#fcfafa` fill, then the same bottom bar as the start screen.

AI message text is `content/primary` throughout, including “When is this for?” and “You can have this for lunch”.

### Meal recommendation — `227:15282`

This node is the recommendation-card variant set, not a full phone screen. The conversation screen shows the default complete card. Card fill stays `surface/recommendation-card`.

## Components

### Button — `7:129`

Padding **12** vertical, **16** horizontal. Radius `radius/md`. Label `typography/button`.

| Variant | Fill | Border | Label |
|---|---|---|---|
| Primary default | `button/surface/primary` | none | `button/text` |
| Primary pressed | `button/pressed` | none | `button/text` |
| Secondary default | `surface/default` | 1px `border/button` | `content/primary` |
| Secondary pressed | `colors/primary-orange/100` | 1px `border/button` plus the pressed shadow | `content/primary` |

No disabled text-button variant. **Needs decision.** On the recommendation card, both buttons are equal width, gap **12**, and the primary gains the orange shadow.

### Icon button — `11:334`

Icon **22**, padding **8**, gap **8**, `radius/pill`, 1px border the same color as the fill.

| State | Fill |
|---|---|
| Default | `button/surface/primary` |
| Disabled | `button/surface/disabled` |

Pressed is not defined. **Needs decision.**

### Back — `7:131`

**40×40**, padding **9**, icon **24**, `radius/pill`, fill `surface/base`.

The more control is **40×40**, padding **8**, `radius/pill`, icon **24**, same fill. It is not the icon-button component.

### Question chips — `196:14022`

Default appearance is the conversation screen. Padding **8 / 4**, radius `radius/md`, gap **8**, border 1px `rgba(0,0,0,0.1)`, text `typography/body/sm`, `content/primary`, no fill.

Selected (`Variant2`) keeps its existing fill, `colors/primary-orange/50`. The approved screen does not show a selected chip.

### Ingredient chip — `227:15279`

Fill `colors/neutral-orange/100`, padding **8 / 4**, radius `radius/md`, label `typography/label`, `content/tertiary`. One state.

### Composer — `11:287`

`surface/default`, padding **8**, radius `radius/md`, composer shadow. Sample width **359**; on the screens it stretches inside **12** of horizontal page padding. Placeholder: “Tell Lumo about your meal…”, `typography/body/sm`, `content/disabled`. Add icon **24** inside padding **8**, radius `radius/sm`. Send uses the icon button.

| State | Layout | Send |
|---|---|---|
| Inactive | Single row, placeholder | Disabled |
| Active | Single row, placeholder | Primary |
| Typed | Single row. Caret is `content/on-brand`, then the placeholder | Primary |
| Multiline | Height **114**. Text `content/primary`. Add and send on the bottom row, gap **12** | Primary |
| Photo | Height **187**. Thumbnail **69**, radius `radius/xs`. Remove control **16**, blur **6**, border `border-width/thin` `content/secondary`. Caption `content/primary` | Primary |

### Chat — `31:1854`

| Variant | Spec |
|---|---|
| AI message | No bubble. `typography/body/default`, `content/primary`, width **307**. |
| User message | Fill `colors/primary-orange/50`. Text `content/primary`. Padding **12 / 8**. Radius **24 / 24 / 24 / 6** (top-left, top-right, bottom-left, bottom-right). Hug content; align end. |
| Updating | Loader, gap **17**, then “Updating the change” in `typography/body/sm`, `colors/secondary/600`. States `default`, `second`, and `third` only change the loader frame. |

### Loader — `49:3426`

Three **10** dots, no gap. Colors: `button/surface/primary`, `colors/peach/400`, `surface/recommendation`. Three variants rotate which dot is which. Duration and easing are not specified. **Needs decision.**

### Recommendation card — `227:15282`

Width **304**. Radius `radius/md`, card shadow, 1px `border/subtle`, fill `surface/recommendation-card`, padding **12** vertical. Content inset **16**, stack gap **12**, then a **4** gap before the recipe toggle.

| Slot | Spec |
|---|---|
| Eyebrow | Small-change row. “Complete meal” or “Quick meal”. |
| Title | `typography/heading/md`, `content/primary`. |
| Time | 16 icon, gap **4**, `typography/body/sm`, `content/primary`. Hidden when closed. |
| Benefit | `typography/body/sm`, `content/secondary`. Hidden when closed. |
| Divider | 1px `border/divider`. |
| Toggle | “View recipe” or “Hide recipe”, Medium 12 / 16, chevron hit area **24**. |
| Actions | Equal buttons, gap **12**, inset **12**. Hidden when closed. |

Variants: `type` is `complete` or `quick`. `property1` is `closed`, `default`, or `opened`.

- Closed: eyebrow, title, divider, “View recipe”. No time, benefit, or actions.
- Default: full summary plus both actions.
- Opened: “Hide recipe”, then one recipe card for quick, or two stacked recipe cards for complete (gap **8**). Actions stay.

The conversation screen shows the default complete card, plus a second default card in a horizontal row (gap **12**).

### Recipe card — `227:15675`

Width **270**, padding **12**, gap **8**, radius `radius/md`, fill `colors/neutral-orange/50`. Ingredient chip, then section gap **4**. Section title Bold 14 / 20. Body and numbered steps are `typography/body/sm`, `content/tertiary`. Step indent **21**, step gap **8**.

### Small change — `147:18341`

Dot **8×16**, gap **4**, label `typography/label`, `content/on-brand`. Sample width **274**.

### Chat menu — `227:14191`

`surface/default`, radius `radius/sm`, menu shadow, padding **12 / 8**. Rows: padding **8**, gap **8**, icon **24**, label `typography/label`, `content/secondary`. Items in the component: New chat, History. Hover, pressed, and selected are not defined. **Needs decision.** The approved conversation screen shows the more button, not the open menu.

## Needs decision

These interaction states are not specified on the approved screens or the linked component variants:

- Text-button disabled.
- Icon-button pressed.
- Chat-menu hover, pressed, and selected.
- Loader duration and easing.

Existing variants stay as defined: button pressed, icon-button disabled, question-chip selected, composer inactive, chat updating, the three loader frames, and recommendation closed / default / opened. No error variant is defined.
