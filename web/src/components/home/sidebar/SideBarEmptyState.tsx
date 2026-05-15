export const SidebarEmptyState = ({ message }: { message: string }) => (
  <div className='px-2 py-8 text-center'>
    <p className='text-xs text-muted-foreground'>{message}</p>
  </div>
);
