# Theming

In many projects, it's common to apply different themes, such as dark/light mode or brand-specific color schemes. However, since the `style` property in SolidJS is designed to be read-only (to enable reusability across multiple components), dynamic theming can seem tricky. Fortunately, there are a few effective approaches to achieve this.

## Spreading Styles

To dynamically apply dark or light styles, you can use the spread operator to merge theme-specific styles into your component. For example:

```js
const dark = { color: '#000' };
const light = { color: '#FFF' };
```

To apply these styles based on a `mode` prop:

```jsx
{...(props.mode === 'dark' ? dark : light)}
```

The spread operator merges the selected theme's styles into the component, making it a simple way to toggle between themes.

## Applying Dynamic States for Theming

You can also use the state system to apply styles dynamically based on the current theme. For instance, the `states` attribute can apply different styles depending on whether the theme is set to `dark` or `light`.

```jsx
const styles = {
  ...defaultStyles,
  dark: { color: '#000' },
  light: { color: '#FFF' }
};

style={styles} states={{ dark: true }} // Apply all styles defined in the 'dark' object
```

In this approach, the theme state (e.g., `dark` or `light`) is defined in the `states` object, and you can toggle between themes dynamically. This method is especially useful when allowing user interaction, such as switching themes via a toggle button.

## Advanced Theming System

For more complex theme requirements, you can adopt an advanced theming system, such as the one used in [Solid-UI](https://github.com/rdkcentral/solid-ui). This system applies `tones` (theme-specific styles) to components, which helps modularize the styling for different themes (e.g., dark and light modes).

By separating styles into modular themes, you can dynamically toggle between themes without re-rendering components or duplicating code.
