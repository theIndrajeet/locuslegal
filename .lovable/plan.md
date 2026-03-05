

## Add "School" Field to Student Waitlist Form

Add a new "School / University" text input to the student form between the "Year of study" and "City" fields. To keep the form the same overall size, the Year and School fields will share a row using a 2-column grid.

### Changes in `src/components/WaitlistSection.tsx`

1. **Update state**: Add `school` to `studentForm` state (`{ email: "", year: "", city: "", school: "" }`) and reset logic.

2. **Add school input**: Insert a new text input for "School / University" after the year select.

3. **Share a row**: Wrap the Year and School fields in a single `motion.div` with `grid grid-cols-2 gap-3` so they sit side by side, keeping the form the same height and width.

No other files affected. Form dimensions stay unchanged since we're replacing one full-width row with two half-width fields on the same row.

