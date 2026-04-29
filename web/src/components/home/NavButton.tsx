import Image from 'next/image';
import { WaterRipple } from '~components/visual-effects/WaterRipple';

export interface NavButtonProps {
  navigateUp: () => void;
  showBackButton: boolean;
}
export const NavButton = ({ navigateUp, showBackButton }: NavButtonProps) => {
  return (
    <WaterRipple className='rounded-full cursor-pointer'>
      <div className='-home-nav-button- pointer-events-auto'>
        {showBackButton && (
          <button onClick={navigateUp} className='p-2 rounded-full' aria-label='Navigate up'>
            <Image src='/expand-scope.svg' alt='' width={28} height={28} className='dark:invert' />
          </button>
        )}
      </div>
    </WaterRipple>
  );
};
