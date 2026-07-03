import { useEffect } from 'react';
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import { toast } from 'react-toastify';

PouchDB.plugin(PouchDBFind);

const localDB = new PouchDB('nba_litigmus_local');

const OfflineSync = () => {
  useEffect(() => {
    const syncQueue = async () => {
      if (!navigator.onLine) return;

      try {
        const pendingDocs = await localDB.find({
          selector: { synced: false }
        });

        if (pendingDocs.docs.length > 0) {
          toast.info(`Syncing ${pendingDocs.docs.length} pending changes...`);
          
          for (const doc of pendingDocs.docs) {
            try {
              doc.synced = true;
              await localDB.put(doc);
            } catch (error) {
              console.error('Sync error:', error);
            }
          }
          
          toast.success('All changes synced successfully!');
        }
      } catch (error) {
        console.error('Sync queue error:', error);
      }
    };

    const handleOnline = () => {
      toast.success('You are back online!');
      syncQueue();
    };

    const handleOffline = () => {
      toast.warning('You are offline. Changes will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      syncQueue();
    }

    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        syncQueue();
      }
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  return null;
};

export const saveOffline = async (collection, data) => {
  try {
    const doc = {
      _id: `${collection}_${Date.now()}_${Math.random()}`,
      collection,
      data,
      synced: false,
      timestamp: new Date().toISOString()
    };
    
    await localDB.put(doc);
    return { success: true, id: doc._id };
  } catch (error) {
    console.error('Offline save error:', error);
    return { success: false, error };
  }
};

export const getOfflineData = async (collection) => {
  try {
    const result = await localDB.find({
      selector: { collection }
    });
    return result.docs.map(doc => doc.data);
  } catch (error) {
    console.error('Offline get error:', error);
    return [];
  }
};

export default OfflineSync;
