export interface ProfileData {
  username: string;
  email: string;
  joinDate: string;
  totalConversations: number;
  preferredSpecialist: string;
}

const defaultProfile: ProfileData = {
  username: '',
  email: '',
  joinDate: new Date().toLocaleDateString(),
  totalConversations: 0,
  preferredSpecialist: 'General Psychology'
};

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const notifyProfileUpdated = () => {
  if (!isBrowser || typeof window.dispatchEvent !== 'function') {
    return;
  }

  window.dispatchEvent(new CustomEvent('mate:profile-updated'));
};

export const computeTotalConversations = (): number => {
  if (!isBrowser) {
    return 0;
  }

  let count = 0;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith('conversation_') && !key.endsWith('_messages')) {
      count += 1;
    }
  }

  return count;
};

export const loadProfile = (): ProfileData => {
  if (!isBrowser) {
    return { ...defaultProfile };
  }

  const totalConversations = computeTotalConversations();
  const storedProfile = localStorage.getItem('profile');
  const legacyUsername = localStorage.getItem('username') || defaultProfile.username;

  if (storedProfile) {
    try {
      const parsedProfile = JSON.parse(storedProfile) as Partial<ProfileData>;
      const joinDate = parsedProfile.joinDate || new Date().toLocaleDateString();
      const profile: ProfileData = {
        ...defaultProfile,
        ...parsedProfile,
        username: parsedProfile.username ?? legacyUsername,
        joinDate,
        totalConversations
      };

      localStorage.setItem('profile', JSON.stringify(profile));
      if (profile.username) {
        localStorage.setItem('username', profile.username);
      }

      return profile;
    } catch (error) {
      console.warn('Failed to parse stored profile. Resetting to defaults.', error);
    }
  }

  const newProfile: ProfileData = {
    ...defaultProfile,
    username: legacyUsername,
    joinDate: new Date().toLocaleDateString(),
    totalConversations
  };

  localStorage.setItem('profile', JSON.stringify(newProfile));
  if (newProfile.username) {
    localStorage.setItem('username', newProfile.username);
  }

  return newProfile;
};

export const saveProfile = (profile: ProfileData): ProfileData => {
  if (!isBrowser) {
    return profile;
  }

  const totalConversations = computeTotalConversations();
  const profileToPersist: ProfileData = {
    ...profile,
    totalConversations
  };

  localStorage.setItem('profile', JSON.stringify(profileToPersist));
  localStorage.setItem('username', profileToPersist.username);
  notifyProfileUpdated();

  return profileToPersist;
};

export const syncProfileConversationCount = (): ProfileData | null => {
  if (!isBrowser) {
    return null;
  }

  const totalConversations = computeTotalConversations();
  const storedProfile = localStorage.getItem('profile');

  if (!storedProfile) {
    const profile = loadProfile();
    notifyProfileUpdated();
    return profile;
  }

  try {
    const parsedProfile = JSON.parse(storedProfile) as Partial<ProfileData>;
    const updatedProfile: ProfileData = {
      ...defaultProfile,
      ...parsedProfile,
      joinDate: parsedProfile.joinDate || new Date().toLocaleDateString(),
      totalConversations
    };

    localStorage.setItem('profile', JSON.stringify(updatedProfile));
    if (updatedProfile.username) {
      localStorage.setItem('username', updatedProfile.username);
    }
    notifyProfileUpdated();
    return updatedProfile;
  } catch (error) {
    console.warn('Failed to parse stored profile while syncing conversations.', error);
    const profile = loadProfile();
    notifyProfileUpdated();
    return profile;
  }
};
