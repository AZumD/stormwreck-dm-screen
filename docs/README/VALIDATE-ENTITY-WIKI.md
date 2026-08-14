# VALIDATE-ENTITY-WIKI.js

## Purpose
Checks catalogue wiki cross-links and EntityUI single-modal Back navigation.

## File
`test/validate-entity-wiki.js`

## Run
```bash
node test/validate-entity-wiki.js
```

## Covers
- Monster Feature / Action refs resolve into modal details
- Skill resolve + `@feature` / `@skill` rich-text links
- Unresolvable legacy strings stay plain text
- Campaign `@monster` links still work
- Modal history push / Back / close clears stack
- Feature types Monster Trait / Action need no EntityRegistry type changes
