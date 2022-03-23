/**
 * Copyright 2021 Expedia, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';

import { iconFactoryAs } from '../../shared/icon-factory';
import type { RootState } from '../../store/store';
import { NumberIconButton } from '../number-icon-button/number-icon-button';

interface Props {
  disabled?: boolean;
  label: string;
  liked: boolean;
  likeCount?: number;
  onLike: (liked: boolean) => Promise<boolean>;
  size?: string;
}

export const LikeButton = ({ disabled, label, likeCount, liked, onLike, size }: Props) => {
  const { loggedIn } = useSelector((state: RootState) => state.user);
  const [saving, setSaving] = useState(false);

  const onClick = async () => {
    setSaving(true);
    await onLike(!liked);
    setSaving(false);
  };

  return (
    <NumberIconButton
      label={label}
      icon={liked ? iconFactoryAs('heartFilled') : iconFactoryAs('heart')}
      number={likeCount}
      onClick={onClick}
      color={liked ? 'aurora.100' : 'polar.600'}
      isLoading={saving}
      isDisabled={disabled || !loggedIn}
      size={size}
      tooltip={false}
    />
  );
};
