import Image from 'next/image';
import { WaterRipple } from '~components/visual-effects/WaterRipple';

export interface NavButtonProps {
  navigateUp: () => void;
  showBackButton: boolean;
}
export const NavButton = ({ navigateUp, showBackButton }: NavButtonProps) => {
  return (
    <WaterRipple className="rounded-full">
      <div className="-home-nav-button- pointer-events-auto cursor-pointer">
        {showBackButton && (
          <button onClick={navigateUp} className="p-2 rounded-full" aria-label="Navigate up">
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
    </WaterRipple>
  );
};
