# Complete Game Image Prompt - Dark Fantasy Dungeon Crawler Asset Pack

Use this English master prompt for ChatGPT Image or another controlled image workflow to generate a coherent full visual asset pack for the game.

```text
Create a complete, coherent, hand-authored pixel-art visual asset pack for a 2D top-down dark-fantasy dungeon crawler game made in Godot.

The final goal is not one decorative illustration. The goal is a production-ready game art bible and asset pack direction that can be split into usable PNG assets, sprite sheets, UI panels, title screens, buttons, fonts, numbers, characters, enemies, tilesets, props, icons, VFX, and HUD elements.

IMPORTANT STYLE LOCK
- Real intentional pixel art, hand-authored look, not smooth digital painting.
- 32x32 tile foundation for the world.
- Top-down / three-quarter dungeon crawler readability.
- Inspired by high-quality 16-bit / 32-bit console RPGs, SNES dark fantasy RPGs, Mega Drive / Sega Genesis arcade readability, GBA RPG clarity, and professional itch.io pixel-art asset packs.
- No AI-smudged pixels, no random noise textures, no blurry anti-aliasing, no vector shapes, no 3D render look, no fake pixel filter, no generic mobile-game plastic UI.
- Clean silhouette, limited coherent palette, strong value separation, readable objects at 1x and 2x scale.
- Consistent camera angle, consistent tile scale, consistent outline/shadow rules, consistent light direction.
- The pack must feel like one unified game, not separate unrelated assets.

GAME THEME
A dark-fantasy dungeon crawler with room-based maps, loot/build progression, bosses, relics, corrupted magic, underground ruins, cursed stone halls, crypts, prison cells, treasure rooms, traps, torches, blood-red runes, green soul-fire magic, and ancient demonic architecture. Mood: dangerous, mysterious, premium indie pixel-art game, readable gameplay first.

COLOR / PALETTE DIRECTION
Use a limited but expressive palette:
- Main background: deep black, charcoal, dark blue-gray, cold stone gray.
- Accent magic: toxic emerald green / soul-fire green.
- Danger accents: blood red, ember orange, cursed purple.
- UI metal/frames: dark iron, oxidized bronze, aged gold highlights.
- Loot rarity colors: common gray, uncommon green, rare blue, epic purple, legendary gold, cursed red.
- Avoid over-saturation. Keep contrast high enough for gameplay.

DELIVER THE PACK AS A CLEARLY ORGANIZED CONTACT SHEET / ASSET BOARD
The generated image should be arranged like a professional game asset board with labeled sections and enough empty spacing between assets so they can later be cropped. Use transparent-background style presentation where appropriate, or show assets on a dark neutral grid. Every asset should have clean pixel edges.

REQUIRED SECTIONS

1. TITLE SET / LOGO SYSTEM
Create a complete game title/logo direction:
- Main title logo for the game: dark fantasy dungeon crawler, sharp readable letters, stone/iron/rune aesthetic.
- Subtitle plate / banner version.
- Small compact logo version for menus.
- Title screen decorative elements: broken arch, skull, sword, green cursed flame, rune circle.
- Title should be readable at large and medium sizes.
- Pixel-art lettering must look manually designed, not typed with a modern font.
- Include empty title plaque variations without text so custom text can be added later.

2. FONT / LETTERING SYSTEM
Create a pixel font visual direction and glyph samples:
- Uppercase A-Z.
- Lowercase a-z if possible.
- Digits 0-9.
- Common punctuation: . , ! ? : ; / - + x % # $ ( ) [ ]
- Style: readable fantasy pixel font, high contrast, not overly decorative.
- Include two sizes: small UI font and large title/menu font.
- Include light text, gold text, green magic text, red danger text variants.
- The font must be readable on dark UI panels and inside small buttons.

3. NUMBERS / DAMAGE / UI COUNTERS
Create game-ready number sets:
- White normal numbers 0-9.
- Gold coin numbers 0-9.
- Red damage numbers 0-9.
- Green healing numbers 0-9.
- Purple magic/curse numbers 0-9.
- Critical hit numbers with stronger outline/glow.
- Small timer digits.
- Large level-up / score digits.
- Include plus, minus, percentage, slash, multiplier x, decimal dot, colon.
- All numbers must have consistent pixel thickness and clean outlines.

4. BUTTONS / MENU UI SET
Create a full UI button kit:
- Main menu buttons: Start, Continue, Options, Credits, Exit.
- Blank button states: normal, hover, pressed, disabled, selected.
- Small icon buttons: back, close X, settings gear, inventory bag, map, skills, character, pause, play, confirm checkmark, cancel X.
- Mobile/touch-style large buttons if needed: attack, dodge, skill 1, skill 2, potion.
- Button materials: dark iron frame, stone fill, gold trim, green magic hover glow.
- Must remain readable and clickable at game scale.
- Include 9-slice style panel corners/edges/center pieces for scalable UI.

5. HUD / IN-GAME INTERFACE
Create HUD components:
- Health bar: red fill, dark iron frame, damaged/cracked variant.
- Mana/energy bar: blue or green magic fill.
- Stamina/dodge bar: yellow/amber fill.
- XP bar: purple or emerald fill.
- Boss health bar: large gothic frame with skull/rune ends.
- Mini-map frame.
- Inventory slot frame: empty, occupied, selected, locked, cursed.
- Hotbar slots 1-8.
- Tooltip panel.
- Dialogue box panel.
- Quest/notification plaque.
- Level-up banner.
- Loot pickup notification.
- Death screen frame.
- Victory/clear room frame.

6. ICON SET
Create small readable pixel icons:
- Sword, axe, dagger, bow, staff, shield.
- Helmet, armor, boots, gloves, ring, amulet, cloak.
- Potion red, potion blue, potion green, antidote, bomb, key, scroll.
- Gold coin, gem, chest, bag, relic shard.
- Fire, ice, lightning, poison, blood, shadow, holy, curse, soul.
- Stats: heart/HP, mana crystal, speed boot, damage sword, crit star, armor shield, luck clover, cooldown hourglass.
- Rarity borders: common, uncommon, rare, epic, legendary, cursed.
- Icons should fit 16x16 and 32x32 use cases.

7. TILESETS - 32x32 DUNGEON FOUNDATION
Create modular 32x32 tiles suitable for Godot TileMap:
- Stone floor base tile.
- 6-10 floor variations with cracks, dirt, stains, moss, runes, blood, broken stones.
- Wall tiles: front wall, side wall, top cap, inner corners, outer corners.
- Door frames: closed, open, locked, boss door, secret door.
- Stairs up/down, ladders, trapdoors.
- Pit edges, abyss tiles, bridge pieces.
- Water/sewer/lava/magic pool edge tiles.
- Transition tiles between rooms.
- Tiles must align on a 32x32 grid and not create accidental seams.
- Collision-readable walls and obstacles must be visually clear.

8. ROOM / ENVIRONMENT PROPS
Create separated dungeon props:
- Torch, candle, brazier with green flame, wall lantern.
- Wooden crates, barrels, sacks, bones, skull piles, chains.
- Broken columns, statues, rubble, bookshelves, altar, ritual circle.
- Treasure chest: closed, open, locked, cursed.
- Spike trap, floor blade trap, pressure plate, dart hole, poison vent.
- Prison bars, cage, hanging chains.
- Magic portal, save shrine, merchant table, upgrade anvil.
- Props should be isolated with transparent background style and also previewed inside a small room mockup.

9. PLAYER CHARACTER SYSTEM - MODULAR PAPER-DOLL SPRITES
Create a main player character system for a top-down dungeon crawler:
- Base body suitable for 32x32 or 32x48 frames.
- 8 directions: down, down-right, right, up-right, up, up-left, left, down-left.
- Idle, walk, attack, cast spell, hurt, death, dodge/roll, item pickup.
- Modular layers concept: base body, hair/head, armor, helmet, weapon, shield, cloak, aura, mutation effects.
- Equipment changes should be visible and synchronized with the base animation.
- Relic/build mutations can alter eyes, skin, posture, aura, or full form.
- Character must have a readable silhouette, stable bottom-center anchor, consistent feet baseline, and no jitter.
- Details must be suggested with clean pixel clusters, not noisy texture.

10. PLAYABLE CHARACTER VARIANTS
Create 4 playable archetypes in the same style:
- Knight / melee tank: sword + shield, heavy armor, readable broad silhouette.
- Rogue / assassin: dagger, hood, light armor, agile pose.
- Mage / occult caster: staff, robe, green/purple magic aura.
- Ranger / hunter: bow/crossbow, cloak, leather armor.
For each: show front, side, back, and one action pose. Keep scale consistent.

11. ENEMIES
Create enemy sprites with clear gameplay silhouettes:
- Small skeleton warrior.
- Slime / corrupted ooze.
- Bat / flying demon.
- Goblin / dungeon thief.
- Zombie / cursed prisoner.
- Spider / crawler.
- Cultist mage.
- Armored knight enemy.
- Mimic chest.
- Elite enemy variants with stronger outline/glow.
Show at least idle pose, attack pose, hurt/death indication, and size comparison with player.

12. BOSSES
Create 3 boss concepts:
- Necromancer lord: tall robe, skull staff, green soul fire.
- Demon butcher / dungeon guardian: huge body, weapon, red danger accents.
- Ancient stone golem / cursed statue boss: cracked stone, glowing runes.
Bosses may be 64x64, 96x96, or larger, but must still match the same pixel-art camera and palette. Include boss icon/portrait and boss health bar decoration.

13. ANIMATION / SPRITE SHEET REQUIREMENTS
Show the pack in a way that can become sprite sheets:
- Rows clearly organized by direction or action.
- Columns clearly organized by animation frames.
- Idle: 4 frames.
- Walk: 6 frames.
- Attack: 6 frames.
- Cast: 6 frames.
- Hurt: 2-3 frames.
- Death: 6-8 frames.
- Dodge/roll: 6 frames.
- VFX should have 4-8 frame cycles.
- Stable anchor: bottom-center foot point.
- Separate visual bounds from collision hitbox.
- Include tiny diagrams for hitbox/hurtbox/interaction box if possible.

14. VISUAL EFFECTS / VFX
Create pixel-art effects:
- Sword slash arcs.
- Impact sparks.
- Blood hit effect.
- Shield block effect.
- Fireball, ice shard, lightning bolt, poison cloud, shadow burst, holy flash.
- Green soul flame loop.
- Portal swirl.
- Level-up burst.
- Loot sparkle.
- Boss attack warning telegraph circles/runes.
Effects must be readable and not cover gameplay too much.

15. ITEM / LOOT SYSTEM
Create pickup sprites and inventory item art:
- Weapons in multiple rarities.
- Armor pieces.
- Relics with unique silhouettes.
- Coins, gems, keys, scrolls.
- Potions.
- Cursed artifacts.
- Each item should have a 16x16 or 32x32 icon version and optionally a larger inventory version.
- Rarity frames must be consistent.

16. MAP / LEVEL SELECT / META UI
Create UI for progression:
- Dungeon map nodes.
- Room icons: combat, elite, shop, treasure, event, boss, healing, locked.
- Line connectors between rooms.
- Floor/biome badge.
- Character selection cards.
- Upgrade cards / relic cards.
- Pause menu panel.
- Settings sliders/check boxes.
- Save slot panel.

17. SCENE MOCKUPS
Include 2-3 small mock gameplay scenes to prove the assets work together:
- Normal dungeon combat room with player, enemies, props, HUD.
- Treasure/shop/rest room with chest or merchant shrine.
- Boss arena with large boss, boss health bar, attack warning VFX.
These mockups must show real gameplay readability, not only pretty decoration.

18. EXPORT / CROPPING DISCIPLINE
Design the contact sheet so assets can later be cropped cleanly:
- Keep assets separated.
- Avoid overlapping important pieces.
- Use transparent-background presentation where appropriate.
- Avoid perspective inconsistencies.
- Keep pixel edges crisp.
- Do not place UI text over sprites that need cropping.
- Do not include watermarks, signatures, mockup UI from unrelated games, or modern interface clutter.

NEGATIVE PROMPT / AVOID
Avoid: blurry pixels, smudged AI texture, vector art, 3D renders, plastic mobile UI, glossy gradients, random noise, over-detailed unreadable sprites, inconsistent camera angle, inconsistent scale, fake retro filter, modern fonts, photorealistic materials, anime illustration style, soft brush painting, massive single illustration with no separable assets, repeated duplicated assets without variation, unreadable tiny text, copyrighted game logos or direct copies of existing game assets.

FINAL QUALITY TARGET
The output should look like the first full visual bible for a premium indie top-down dungeon crawler: professional, coherent, modular, readable, and ready to be split into game assets for Godot. Prioritize usability, clean pixel logic, consistent scale, and a unified dark fantasy identity.
```

## Short follow-up prompt for variations

```text
Using the exact same art direction, palette, pixel scale, and UI style from the previous asset board, create additional clean separated assets for [specific category: buttons / numbers / enemies / tiles / bosses / icons / character animations]. Keep everything compatible with the original 32x32 top-down dark-fantasy dungeon crawler pack. Use crisp hand-authored pixel art, transparent-background style, consistent scale, no blur, no procedural noise, and no unrelated redesign.
```
