// globals.d.ts

// This tells TypeScript that any file ending in .css is a valid module
// and that importing it (for side effects) is acceptable.
declare module "*.css" {
    // If you are using CSS modules, you would export a default type:
    // const content: { [className: string]: string };
    // export default content;

    // For standard global CSS imports, just declaring the module is enough:
    const content: any;
    export default content;
}

// You might also add declarations for other assets you import, like images:
// declare module '*.png' {
//   const value: string;
//   export default value;
// }
