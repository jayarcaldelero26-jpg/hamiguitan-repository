# Mobile Checklist

## Fixed

- Protected layout now uses a mobile drawer sidebar with backdrop and a compact top bar trigger on small screens.
- Protected pages now use reduced mobile padding and better wrapping for headers, chips, and action rows.
- Dialogs and preview modals now cap height on mobile, scroll internally, and stack action buttons when space is tight.
- Dashboard document actions now wrap cleanly on small screens, and the preview modal header/actions fit narrow widths.
- Research document cards now use larger touch targets and keep actions readable on mobile.
- Upload page spacing, file card layout, preview summary grid, and remove-file tap target were adjusted for small screens.
- Settings page tab strip now scrolls horizontally on mobile instead of compressing buttons.
- Admin users now has a dedicated mobile card list while preserving the desktop table for larger screens.
- Login page mobile spacing and tap targets were tightened without changing the desktop layout.

## Manual Testing Still Needed

- Open the sidebar drawer on an actual Android phone and verify backdrop tap, route navigation, and scroll behavior.
- Test Chrome address-bar expand and collapse behavior on long protected pages and inside modals.
- Verify the admin user modal, confirm dialogs, and dashboard preview iframe with the Android keyboard open.
- Check the admin table and any remaining wide data views on tablet widths for acceptable horizontal scrolling.
- Test upload, settings, and admin pages with long text values, long emails, and long folder names on a real phone.
