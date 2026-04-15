export function getRoomTypeIcon(roomType: string | null | undefined) {
  switch (roomType) {
    case 'living_room':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18v6a1 1 0 01-1 1h-1v-4H5v4H4a1 1 0 01-1-1v-6zm2-5h4v3H5V7zm10 0h4v3h-4V7z" />
        </svg>
      );
    case 'kitchen':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v8m0 0a2 2 0 11-4 0m4 0a2 2 0 10-4 0m9-8v18m0-18h4m-4 6h3m-3 6h3" />
        </svg>
      );
    case 'master_bedroom':
    case 'bedroom':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18v7h-2v-3H5v3H3v-7zm3-4a2 2 0 114 0v1H6V8zm6 1h6a2 2 0 012 2v1H12v-3z" />
        </svg>
      );
    case 'bathroom':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 13h16v2a5 5 0 01-5 5H9a5 5 0 01-5-5v-2zm3-5a2 2 0 114 0v5H7V8z" />
        </svg>
      );
    case 'dining_room':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16v2H4V8zm8 2v10m-5 0h10" />
        </svg>
      );
    case 'home_office':
    case 'library':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v10H4V5zm6 10v4m4-4v4m-7 0h10" />
        </svg>
      );
    case 'laundry_room':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h14v16H5V4zm4 3h1m2 0h1m-3 5a3 3 0 106 0 3 3 0 10-6 0z" />
        </svg>
      );
    case 'garage':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10l9-6 9 6v9a1 1 0 01-1 1h-2v-5H6v5H4a1 1 0 01-1-1v-9z" />
        </svg>
      );
    case 'storage_room':
    case 'basement':
    case 'attic':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16v12H4V7zm3 3h10m-10 4h10" />
        </svg>
      );
    case 'gym':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h3v4H3v-4zm15 0h3v4h-3v-4zM8 9h2v6H8V9zm6 0h2v6h-2V9z" />
        </svg>
      );
    case 'home_theater':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4V6zm5 4l6 2-6 2v-4z" />
        </svg>
      );
    case 'game_room':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 10h10a3 3 0 013 3v2l-2 2h-2l-2-2H10l-2 2H6l-2-2v-2a3 3 0 013-3zm2 3h2m4 0h.01M17 12h.01" />
        </svg>
      );
    case 'balcony':
    case 'terrace':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16M6 20V9h12v11M9 9V6h6v3" />
        </svg>
      );
    case 'garden':
    case 'backyard':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V9m0 0c-3 0-5-2-5-5 3 0 5 2 5 5zm0 0c3 0 5-2 5-5-3 0-5 2-5 5z" />
        </svg>
      );
    case 'pool_area':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 17c2 2 4 2 6 0s4-2 6 0 4 2 6 0M3 12c2 2 4 2 6 0s4-2 6 0 4 2 6 0" />
        </svg>
      );
    case 'entrance_hallway':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12v18H6V3zm4 9h4m-1 0v6" />
        </svg>
      );
    default:
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
        </svg>
      );
  }
}
