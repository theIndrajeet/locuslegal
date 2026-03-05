

## Change Rainbow Button to Yellow/Gold Theme

Update the CSS color variables used by the RainbowButton in `src/index.css` to use yellow/gold tones matching the site's accent color instead of the multi-color rainbow.

### Changes

**`src/index.css`** — Replace the 5 rainbow color variables in both `:root` and `.dark` blocks with yellow/gold shades:

```css
--color-1: 45 100% 51%;   /* gold */
--color-2: 40 100% 45%;   /* darker gold */
--color-3: 50 100% 55%;   /* lighter gold */
--color-4: 35 95% 50%;    /* amber */
--color-5: 55 100% 60%;   /* yellow */
```

This keeps the animated gradient effect but constrains it to the yellow/gold palette, matching the site's accent theme.

