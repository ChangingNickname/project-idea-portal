export {}
declare global {
  type AnyObject = {[key:string]: unknown}
  type ULocaleKey = NestedKey<typeof ru>
} 