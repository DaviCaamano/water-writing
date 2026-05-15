import { useUserStore } from '~store/useUserStore';
import { useState } from 'react';
import { cn } from '~utils/merge-css-classes';
import { FieldLabel, SectionHeading } from '~components/home/user/user-settings/index';
import { Button } from '~components/primitives/button';
import { Input } from '~components/primitives/input';
import { Check, Pencil, X } from 'lucide-react';
import { Variant } from '~types';

export const GeneralSection = () => {
  const { firstName, lastName, email, updateName } = useUserStore();
  const [editingName, setEditingName] = useState(false);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');

  const startNameEdit = () => {
    setEditFirst(firstName);
    setEditLast(lastName);
    setEditingName(true);
  };

  const saveName = async () => {
    if (editFirst !== firstName || editLast !== lastName) {
      await updateName(editFirst, editLast);
    }
    setEditingName(false);
  };

  const cancelNameEdit = () => {
    setEditFirst(firstName);
    setEditLast(lastName);
    setEditingName(false);
  };

  return (
    <div>
      <SectionHeading>Profile</SectionHeading>

      <div className='space-y-5'>
        <div>
          <FieldLabel>Name</FieldLabel>
          {editingName ? (
            <div className={cn('flex items-end gap-2')}>
              <Input
                size='pill'
                value={editFirst}
                onChange={(e) => setEditFirst(e.target.value)}
                placeholder='First'
                className='flex-1'
              />
              <Input
                size='pill'
                value={editLast}
                onChange={(e) => setEditLast(e.target.value)}
                placeholder='Last'
                className='flex-1'
              />
              <Button variant={Variant.default} size='icon' onClick={saveName} aria-label='Save'>
                <Check className='size-4' />
              </Button>
              <Button variant={Variant.default} size='icon' onClick={cancelNameEdit} aria-label='Cancel'>
                <X className='size-4' />
              </Button>
            </div>
          ) : (
            <div className='flex items-center gap-3'>
              <div className="flex-1 rounded-full px-5 py-2.5 text-[14px] embossed">
                {firstName} {lastName}
              </div>
              <Button variant={Variant.default} size='icon' onClick={startNameEdit} aria-label='Edit name'>
                <Pencil className='size-3.5' />
              </Button>
            </div>
          )}
        </div>

        <div>
          <FieldLabel>Email</FieldLabel>
          <div className="rounded-full px-5 py-2.5 text-[14px] text-muted embossed">
            {email || '-'}
          </div>
        </div>
      </div>
    </div>
  );
};
