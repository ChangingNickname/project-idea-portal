interface User {
  photoURL: string | null;
  displayName: string | null;
  email: string | null;
  isAnonymous: boolean;
}

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
}

export function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  const getInitials = () => {
    if (user.isAnonymous) return '?';
    if (user.displayName) {
      const names = user.displayName.split(' ');
      if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'lg':
        return 'w-24 h-24 text-2xl';
      default:
        return 'w-12 h-12 text-lg';
    }
  };

  return (
    <div className={`relative rounded-full overflow-hidden ${getSize()}`}>
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName || 'User avatar'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
          {getInitials()}
        </div>
      )}
    </div>
  );
} 