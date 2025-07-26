# Accessibility Documentation

Singapore Weather Cam application follows WCAG 2.1 AA guidelines to ensure accessibility for all users, including those using assistive technologies.

## Table of Contents

1. [Accessibility Standards](#accessibility-standards)
2. [Component Accessibility Features](#component-accessibility-features)
3. [Keyboard Navigation](#keyboard-navigation)
4. [Screen Reader Support](#screen-reader-support)
5. [Color and Contrast](#color-and-contrast)
6. [Testing Guidelines](#testing-guidelines)
7. [Known Issues and Roadmap](#known-issues-and-roadmap)

## Accessibility Standards

This application aims to meet **WCAG 2.1 AA** compliance standards:

- ✅ **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text
- ✅ **Keyboard Navigation**: All interactive elements accessible via keyboard
- ✅ **Screen Reader Compatibility**: Proper semantic markup and ARIA labels
- ✅ **Focus Management**: Clear focus indicators and logical tab order
- ✅ **Alternative Text**: All images have appropriate alt text or are marked decorative
- ✅ **Form Accessibility**: All form elements have proper labels and error handling

## Component Accessibility Features

### SystemStatus Component

**Features:**
- Live regions for status announcements
- Keyboard navigation between status indicators (arrow keys, Home, End)
- Screen reader announcements for network changes and errors
- Proper ARIA labels and descriptions for all status elements
- Focus management for refresh controls

**Keyboard Shortcuts:**
- `Arrow Keys`: Navigate between status indicators
- `Home/End`: Jump to first/last status indicator
- `Tab`: Navigate to refresh controls
- `Enter/Space`: Activate focused elements

### TemperatureHero Component

**Features:**
- Semantic markup with proper heading structure
- Temperature announcements to screen readers
- Weather condition descriptions for icons
- Error state announcements
- Retry functionality with clear labels

**Screen Reader Support:**
- Temperature values announced with units
- Weather conditions described in text
- Data quality indicators explained
- Loading states communicated clearly

### RegionalMapView Component

**Features:**
- Radio group pattern for region selection
- Keyboard navigation between regions
- Map accessibility with alternative data access
- Statistical data with proper labels
- Live region announcements for region changes

**Keyboard Navigation:**
- `Arrow Keys`: Navigate between region buttons
- `Enter/Space`: Select region
- `Tab`: Navigate through map interface
- Alternative data access via detailed lists

## Keyboard Navigation

### Global Shortcuts

- `Tab`: Navigate forward through interactive elements
- `Shift + Tab`: Navigate backward through interactive elements
- `Ctrl + Shift + M`: Toggle monitoring dashboard
- `Ctrl + Shift + P`: Toggle performance dashboard

### Skip Links

A "Skip to main content" link is available for keyboard users:
- Hidden by default
- Appears when focused
- Jumps directly to main content area

### Focus Management

- Clear, high-contrast focus indicators
- Logical tab order throughout the application
- Focus trapping in modal dialogs
- Focus restoration after modal closure

## Screen Reader Support

### Live Regions

The application uses ARIA live regions to announce:
- System status changes
- Temperature updates
- Data loading states
- Error messages
- Region selection changes

### Semantic Markup

- Proper heading hierarchy (h1-h6)
- Landmark regions (main, navigation, banner, contentinfo)
- Lists for grouped data
- Tables for tabular data with proper headers

### ARIA Labels and Descriptions

All interactive elements have:
- Accessible names (aria-label or visible text)
- Descriptions where needed (aria-describedby)
- State information (aria-expanded, aria-checked)
- Role clarification where necessary

## Color and Contrast

### Compliance

- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text**: 3:1 minimum contrast ratio
- **UI components**: 3:1 minimum contrast ratio
- **Graphical objects**: 3:1 minimum contrast ratio

### High Contrast Mode

Support for users who prefer high contrast:
- Automatic detection of user preference
- Enhanced contrast ratios in high contrast mode
- Maintained functionality with system high contrast themes

### Color Independence

- Information never conveyed by color alone
- Icons and patterns supplement color coding
- Status indicators use text, shapes, and color

## Testing Guidelines

### Automated Testing

**Tools in Use:**
- `axe-core`: Automated accessibility testing (development mode)
- `eslint-plugin-jsx-a11y`: Lint-time accessibility checks
- Custom accessibility utilities for color contrast validation

**Running Tests:**
```bash
npm run lint  # Includes accessibility linting
npm run dev   # Axe-core runs automatically in development
```

### Manual Testing

**Keyboard Testing:**
1. Disconnect mouse
2. Navigate entire application using only keyboard
3. Verify all interactive elements are reachable
4. Test focus visibility and logical order

**Screen Reader Testing:**
1. Test with NVDA (Windows), VoiceOver (macOS), or Orca (Linux)
2. Verify all content is announced correctly
3. Test navigation by headings, landmarks, and forms
4. Verify live region announcements work properly

**Color Contrast Testing:**
1. Use browser developer tools color picker
2. Verify contrast ratios meet WCAG AA standards
3. Test with high contrast mode enabled
4. Verify functionality without color information

### Testing Checklist

#### Page Structure
- [ ] Page has proper heading hierarchy (h1-h6)
- [ ] Main landmarks are present (main, nav, banner, contentinfo)
- [ ] Skip link is available and functional
- [ ] Focus order is logical and intuitive

#### Interactive Elements
- [ ] All buttons have accessible names
- [ ] All links have descriptive text or aria-labels
- [ ] Form elements have proper labels
- [ ] Focus indicators are clearly visible
- [ ] All interactive elements are keyboard accessible

#### Dynamic Content
- [ ] Loading states are announced to screen readers
- [ ] Error messages are announced appropriately
- [ ] Status changes are communicated via live regions
- [ ] New content is properly focused or announced

#### Media and Images
- [ ] All images have appropriate alt text
- [ ] Decorative images are marked with alt="" or aria-hidden
- [ ] Complex images have detailed descriptions
- [ ] Video content has captions (if applicable)

## Known Issues and Roadmap

### Current Limitations

1. **Map Accessibility**: Interactive map has limited keyboard navigation
   - **Workaround**: Alternative data access via detailed lists
   - **Planned**: Enhanced map keyboard controls

2. **Chart Accessibility**: Data visualizations need improvement
   - **Workaround**: Raw data tables provided
   - **Planned**: Sonification and enhanced descriptions

### Planned Improvements

1. **Enhanced Map Navigation**
   - Keyboard controls for map zoom and pan
   - Alternative text-based map exploration
   - Voice announcements for map interactions

2. **Voice Interface**
   - Voice commands for common actions
   - Audio descriptions for visual content
   - Integration with speech recognition APIs

3. **Advanced Customization**
   - User-configurable contrast themes
   - Adjustable animation and motion settings
   - Customizable text size and spacing

### Feedback and Contributions

We welcome feedback on accessibility improvements:
- Report issues via GitHub Issues
- Include details about your assistive technology setup
- Suggest specific improvements or missing features

## Resources and References

### WCAG Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Accessibility Checklist](https://webaim.org/standards/wcag/checklist)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)

### Assistive Technology
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [VoiceOver Guide](https://www.apple.com/accessibility/mac/vision/)
- [Orca Screen Reader](https://help.gnome.org/users/orca/stable/)

---

*Last updated: 2025-07-26*
*WCAG 2.1 AA Compliance Target*