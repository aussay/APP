import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Achievement } from '../types/achievements';
import AchievementNotificationComponent from '../components/AchievementNotification';

interface AchievementNotificationContextType {
  showAchievementNotification: (achievement: Achievement) => void;
}

const AchievementNotificationContext = createContext<AchievementNotificationContextType | undefined>(undefined);

export const useAchievementNotification = () => {
  const context = useContext(AchievementNotificationContext);
  if (!context) {
    throw new Error('useAchievementNotification must be used within an AchievementNotificationProvider');
  }
  return context;
};

interface AchievementNotificationProviderProps {
  children: ReactNode;
}

export const AchievementNotificationProvider: React.FC<AchievementNotificationProviderProps> = ({ children }) => {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [queue, setQueue] = useState<Achievement[]>([]); // Queue for multiple unlocks

  const showNextInQueue = useCallback(() => {
    if (queue.length > 0) {
      const nextAchievement = queue[0];
      setQueue(prev => prev.slice(1));
      setCurrentAchievement(nextAchievement);
    } else {
      setCurrentAchievement(null); // No more achievements to show
    }
  }, [queue]);

  const showAchievementNotification = useCallback((achievement: Achievement) => {
    // If a notification is already showing, add to queue. Otherwise, show immediately.
    if (currentAchievement) {
      setQueue(prev => [...prev, achievement]);
    } else {
      setCurrentAchievement(achievement);
    }
  }, [currentAchievement]);


  const handleDismiss = useCallback(() => {
    setCurrentAchievement(null); // Clear current one
    // Try to show next from queue after a small delay to allow dismiss animation
    setTimeout(() => {
        showNextInQueue();
    }, 500); // Corresponds to animation out duration
  }, [showNextInQueue]);


  return (
    <AchievementNotificationContext.Provider value={{ showAchievementNotification }}>
      {children}
      {/* Render the notification component globally here */}
      <AchievementNotificationComponent
        achievement={currentAchievement}
        onDismiss={handleDismiss}
      />
    </AchievementNotificationContext.Provider>
  );
};
