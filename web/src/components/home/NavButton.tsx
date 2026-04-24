import Image from 'next/image';

export interface NavButtonProps {
  navigateUp: () => void;
  showBackButton: boolean;
}
export const NavButton = ({ navigateUp, showBackButton }: NavButtonProps) => {
  return (
    <div className="-home-nav-button- pointer-events-auto">
      {showBackButton && (
        <button
          onClick={navigateUp}
          className="p-2 rounded-full hover:bg-accent/80 transition-colors"
          aria-label="Navigate up"
        >
          <Image
            src="/expand-scope.svg"
            alt=""
            width={24}
            height={24}
            className="w-6 h-6 dark:invert"
          />
        </button>
      )}
    </div>
  );
};
