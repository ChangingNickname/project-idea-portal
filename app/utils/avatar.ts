export const generateAvatarUrl = (email: string): string => {
  // Using DiceBear API for avatar generation
  // You can choose different styles: avataaars, bottts, identicon, etc.
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`
}
