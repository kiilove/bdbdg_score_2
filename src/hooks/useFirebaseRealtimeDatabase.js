import { useState, useEffect, useRef } from "react";
import { ref, onValue, set, update, remove, off } from "firebase/database";
import { rdb } from "../firebase";

const useFirebaseRealtimeDatabase = (path) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const dbRef = useRef(null);

  useEffect(() => {
    dbRef.current = ref(rdb, path);

    const onDataChange = (snapshot) => {
      setData(snapshot.val());
    };

    const onError = (error) => {
      setError(error);
    };

    onValue(dbRef.current, onDataChange, onError);

    return () => {
      off(dbRef.current, onDataChange);
    };
  }, [path]);

  const create = (newData) => {
    set(dbRef.current, newData);
  };

  const read = () => {
    return data;
  };

  const update = (updatedData) => {
    update(dbRef.current, updatedData);
  };

  const remove = () => {
    remove(dbRef.current);
  };

  return { data, error, create, read, update, remove };
};
