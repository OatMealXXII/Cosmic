type Track = {
    encoded: string;
    info: {
        title: string;
        uri: string;
        author: string;
        length: number;
    };
};

type ShoukakuTrack = {
  track: string;
  info: {
    identifier: string;
    isSeekable: boolean;
    author: string;
    length: number;
    isStream: boolean;
    position: number;
    title: string;
    uri: string;
    sourceName: string;
  };
};

type LoadType = 'TRACK_LOADED' | 'PLAYLIST_LOADED' | 'SEARCH_RESULT' | 'NO_MATCHES' | 'LOAD_FAILED';

type ShoukakuSearchResult = {
  loadType: LoadType;
  tracks: ShoukakuTrack[];
  playlistInfo?: {
    name: string;
    selectedTrack: number;
  };
};

export type { Track, ShoukakuTrack, LoadType, ShoukakuSearchResult };