import { useSyncExternalStore } from "react";

type SearchState = {
  open: boolean;
};

type SearchListener = () => void;

let searchState: SearchState = {
  open: false,
};

const emptySearchState: SearchState = {
  open: false,
};

let listeners: SearchListener[] = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: SearchListener) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): SearchState {
  return searchState;
}

function getServerSnapshot(): SearchState {
  return emptySearchState;
}

export function openSearch() {
  searchState = { ...searchState, open: true };
  emitChange();
}

export function closeSearch() {
  searchState = { ...searchState, open: false };
  emitChange();
}

export function useSearch() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    open: state.open,
    openSearch,
    closeSearch,
  };
}
