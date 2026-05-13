// Silence TS2882 for CSS side-effect imports used by Next.js
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
