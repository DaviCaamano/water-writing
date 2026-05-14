import { useUserStore } from '~store/useUserStore';
import { useState } from 'react';
import { cn } from '~utils/merge-css-classes';
import {
  FieldLabel,
  NeuIconBtn,
  NeuInput,
  SectionHeading,
} from '~components/home/user/user-settings/index';
import { Check, Pencil, X } from 'lucide-react';

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
              <div className='flex-1'>
                <NeuInput
                  value={editFirst}
                  onChange={(e) => setEditFirst(e.target.value)}
                  placeholder='First'
                />
              </div>
              <div className='flex-1'>
                <NeuInput
                  value={editLast}
                  onChange={(e) => setEditLast(e.target.value)}
                  placeholder='Last'
                />
              </div>
              <NeuIconBtn onClick={saveName} aria-label='Save'>
                <Check className='size-4' />
              </NeuIconBtn>
              <NeuIconBtn onClick={cancelNameEdit} aria-label='Cancel'>
                <X className='size-4' />
              </NeuIconBtn>
            </div>
          ) : (
            <div className='flex items-center gap-3'>
              <div className={'flex-1 rounded-full px-5 py-2.5 text-[14px] embossed'}>
                {firstName} {lastName}
              </div>
              <NeuIconBtn onClick={startNameEdit} aria-label='Edit name'>
                <Pencil className='size-3.5' />
              </NeuIconBtn>
            </div>
          )}
        </div>

        <div>
          <FieldLabel>Email</FieldLabel>
          <div className={'rounded-full px-5 py-2.5 text-[14px] text-muted embossed'}>
            {email || '-'}
          </div>
        </div>
      </div>
    </div>
  );
};
