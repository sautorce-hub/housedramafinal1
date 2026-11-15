import type { LanguageCode, LegalModalTopic } from '../types/drama';

export interface Translations {
  nav: {
    home: string;
    movies: string;
    explore: string;
    trending: string;
    latest: string;
    vip: string;
    anime: string;
    dubbed: string;
    watchlist: string;
    dashboard: string;
    search: string;
    providers: string;
    login: string;
    account: string;
  };
  moviesPage: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allMovies: string;
    latestMovies: string;
    categoriesTitle: string;
    genreFilter: string;
    countryFilter: string;
    yearFilter: string;
    allOption: string;
    clearFilters: string;
    noResults: string;
    loadMore: string;
    titlesCount: string;
    watchlistTitle: string;
    watchlistSubtitle: string;
    watchlistLoginTitle: string;
    watchlistLoginDesc: string;
    watchlistEmpty: string;
    browseMoviesBtn: string;
  };
  providers: {
    all: string;
    dramaBox: string;
    netShort: string;
    anyReel: string;
    melolo: string;
    reelShortSoon: string;
    shortMaxSoon: string;
    hubTitle: string;
    hubSubtitle: string;
    searchPlaceholder: string;
    activeLabel: string;
    titlesLoaded: string;
    comingSoon: string;
    noMatches: string;
  };
  hero: {
    featured: string;
    playNow: string;
    viewDetails: string;
    addToList: string;
    inList: string;
  };
  sections: {
    continueWatching: string;
    trendingNow: string;
    recommended: string;
    newReleases: string;
    vipExclusives: string;
    animeDonghua: string;
    dubbedSeries: string;
    netShortTrending: string;
    anyReelAsian: string;
    meloloTrending: string;
    viewAll: string;
    loadMore: string;
    loading: string;
    resumeEp: string;
    removeHistory: string;
    backToHome: string;
    backToBrowse: string;
    hotPicks: string;
    homeCatalogGrid: string;
    exploreTitle: string;
    exploreSubtitle: string;
    exploreAllCategories: string;
    exploreMoreProviders: string;
    pickedForYou: string;
    becauseYouWatched: string;
    dramaWatchlistTitle: string;
    dramaWatchlistSubtitle: string;
    dramaWatchlistEmpty: string;
    exploreDramasBtn: string;
  };
  search: {
    title: string;
    placeholder: string;
    recentSearches: string;
    trendingSearches: string;
    removeRecent: string;
    clearRecent: string;
    searchingBoth: string;
    noResults: string;
    tryAnother: string;
    resultsCount: string;
  };
  player: {
    episodes: string;
    nextReady: string;
    autoNext: string;
    retry: string;
    streamUnavailable: string;
    loadingEp: string;
    watched: string;
    swipeHint: string;
    quality: string;
    fullscreen: string;
    exitFullscreen: string;
    subtitles: string;
    subtitleTracks: string;
    subtitleOff: string;
    noSubtitlesFound: string;
    subtitleStyleLabel: string;
    subtitleSize: string;
    subtitleColor: string;
    subtitleBg: string;
    commentsTitle: string;
    commentPlaceholder: string;
    postComment: string;
    noComments: string;
    shareDrama: string;
    skipIntro: string;
    pip: string;
    like: string;
    liked: string;
    theaterMode: string;
    exitTheaterMode: string;
    audioTrack: string;
    offlineCached: string;
    nextEpisodeIn: string;
    rewind10s: string;
    forward10s: string;
    zoomFill: string;
    zoomFit: string;
    pinchHint: string;
    saveMovie: string;
    savedMovie: string;
    saveDrama: string;
    savedDrama: string;
  };
  auth: {
    signInTitle: string;
    signInWithGoogle: string;
    gateReasonDefault: string;
    gateLikeReason: string;
    gateCommentReason: string;
    gateWatchlistReason: string;
    continueBtn: string;
    signingIn: string;
    authErrorPopupBlocked: string;
    profileTitle: string;
    signedInAs: string;
    likedCount: string;
    savedCount: string;
    dramaWatchlistCount: string;
    openHelpCenter: string;
    signOut: string;
  };
  watchlistStatus: {
    all: string;
    watching: string;
    plan: string;
    completed: string;
    markCompleted: string;
    completedBadge: string;
  };
  engagement: {
    rateTitle: string;
    yourRating: string;
    tapToRate: string;
    shareDrama: string;
    generateSpoilerCard: string;
    downloadSpoilerCard: string;
    generatingCard: string;
    spoilerCardReady: string;
    shareStoryTitle: string;
    copyCaptionLink: string;
    shareWhatsapp: string;
    shareTelegram: string;
    shareX: string;
    shareFacebook: string;
    copyLink: string;
    linkCopied: string;
    shareNative: string;
    vipUnlockTitle: string;
    vipUnlockDesc: string;
    shareToUnlockBtn: string;
    unlockedBadge: string;
    foldersTitle: string;
    createFolder: string;
    folderPlaceholder: string;
    saveToFolder: string;
    themeTitle: string;
    contrastLabel: string;
    highContrast: string;
    standardContrast: string;
  };
  exploreFilters: {
    allGenres: string;
    statusAll: string;
    statusOngoing: string;
    statusCompleted: string;
    sortPopular: string;
    sortRating: string;
    sortNewest: string;
    searchPlaceholder: string;
    resetFilters: string;
    matchingResults: string;
    noFilterMatches: string;
    browseFilteredTitle: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    tabProfile: string;
    tabWatchlist: string;
    tabHistory: string;
    tabComments: string;
    displayNameLabel: string;
    bioLabel: string;
    bioPlaceholder: string;
    languageLabel: string;
    preferencesLabel: string;
    saveChanges: string;
    savedSuccess: string;
    signInRequiredTitle: string;
    signInRequiredDesc: string;
    commentsEmpty: string;
    historyEmpty: string;
    jumpToEp: string;
    streakLabel: string;
    vipActive: string;
    statsWatchlist: string;
    statsHistory: string;
    statsLiked: string;
    statsComments: string;
  };
  retention: {
    streakBadge: string;
    vipCoffeeLover: string;
    streakRule: string;
    streakProgress: string;
    upNextTitle: string;
    upNextPlayingIn: string;
    playNow: string;
    cancel: string;
    pushPromptTitle: string;
    pushPromptDesc: string;
    pushEnableBtn: string;
    pushLaterBtn: string;
    pushEnabledToast: string;
  };
  seoTags: {
    popularTagsTitle: string;
    tagLandingSubtitle: string;
    clearTagFilter: string;
    genres: string[];
  };
  help: {
    title: string;
    subtitle: string;
    faqs: { q: string; a: string }[];
  };
  pwa: {
    installTitle: string;
    installDesc: string;
    installBenefits: string;
    installBtn: string;
    installNow: string;
    later: string;
    iosBtn: string;
    iosGuideTitle: string;
    iosTooltip: string;
    iosStep1: string;
    iosStep2: string;
    close: string;
    offlineBanner: string;
    welcomeBadge: string;
    perkFast: string;
    perkFullscreen: string;
    perkOffline: string;
    browserInstallHint: string;
  };
  footer: {
    tagline: string;
    onlineNow: string;
    todayVisitors: string;
    totalVisitors: string;
    totalViews: string;
    linksTitle: string;
    about: string;
    privacy: string;
    terms: string;
    dmca: string;
    contact: string;
    helpCenter: string;
    rights: string;
  };
  legal: Record<
    LegalModalTopic,
    {
      title: string;
      subtitle: string;
      paragraphs: string[];
    }
  >;
  contactForm: {
    namePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
    send: string;
    sentSuccess: string;
    telegramLabel: string;
    emailLabel: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    nav: {
      home: 'Home',
      movies: 'Movies',
      explore: 'Explore',
      trending: 'Trending',
      latest: 'Latest',
      vip: 'VIP',
      anime: 'Anime',
      dubbed: 'Dubbed',
      watchlist: 'Watchlist',
      dashboard: 'Dashboard',
      search: 'Search',
      providers: 'Providers',
      login: 'Login',
      account: 'Account',
    },
    moviesPage: {
      title: 'Movies & Cinema',
      subtitle: 'Stream feature films, box office hits, Asian cinema, and full series in crisp HD.',
      searchPlaceholder: 'Search movies or series titles...',
      allMovies: 'Featured Movies',
      latestMovies: 'Latest Movies',
      categoriesTitle: 'Browse Categories',
      genreFilter: 'Genre',
      countryFilter: 'Country',
      yearFilter: 'Year',
      allOption: 'All',
      clearFilters: 'Reset',
      noResults: 'No movies matched your query or filter.',
      loadMore: 'Load more movies',
      titlesCount: 'movies',
      watchlistTitle: 'Movie Watchlist',
      watchlistSubtitle: 'Your personal collection of saved films synced to your account.',
      watchlistLoginTitle: 'Sign In to Access Movie Watchlist',
      watchlistLoginDesc: 'Create your personal movie collection and sync saved films across all your devices.',
      watchlistEmpty: 'Your Movie Watchlist is empty. Save any film from the Movies catalog.',
      browseMoviesBtn: 'Browse Movies',
    },
    providers: {
      all: 'All Providers',
      dramaBox: 'DramaBox',
      netShort: 'NetShort',
      anyReel: 'AnyReel',
      melolo: 'Melolo',
      reelShortSoon: 'ReelShort',
      shortMaxSoon: 'ShortMax',
      hubTitle: 'Provider Hub',
      hubSubtitle: 'Switch source catalogs or search across platforms',
      searchPlaceholder: 'Search provider...',
      activeLabel: 'Active',
      titlesLoaded: 'titles',
      comingSoon: 'Coming Soon',
      noMatches: 'No providers match your filter',
    },
    hero: {
      featured: 'Featured Spotlight',
      playNow: 'Play now',
      viewDetails: 'View details',
      addToList: 'Add to Watchlist',
      inList: 'In Watchlist',
    },
    sections: {
      continueWatching: 'Continue Watching',
      trendingNow: 'Trending on House Drama',
      recommended: 'Recommended For You',
      newReleases: 'New Releases',
      vipExclusives: 'VIP Exclusives',
      animeDonghua: 'Anime & Donghua Shorts',
      dubbedSeries: 'Dubbed Series',
      netShortTrending: 'NetShort Trending',
      anyReelAsian: 'AnyReel Asian & Hot',
      meloloTrending: 'Melolo Popular Rank',
      viewAll: 'View all',
      loadMore: 'Load more',
      loading: 'Loading...',
      resumeEp: 'Resume Ep',
      removeHistory: 'Remove from history',
      backToHome: 'Back to Home',
      backToBrowse: 'Back to Browse',
      hotPicks: 'Hot & New Picks',
      homeCatalogGrid: 'Featured Catalog',
      exploreTitle: 'Explore All Categories',
      exploreSubtitle: 'Browse all provider spotlights, anime, dubbed series, and curated rows.',
      exploreAllCategories: 'Explore All Categories',
      exploreMoreProviders: 'Load More Providers',
      pickedForYou: 'Picked For You',
      becauseYouWatched: 'Because You Watched',
      dramaWatchlistTitle: 'Drama Watchlist',
      dramaWatchlistSubtitle: 'Your saved drama series and short reels.',
      dramaWatchlistEmpty: 'Your Drama Watchlist is empty. Save any drama series to binge later.',
      exploreDramasBtn: 'Explore Dramas',
    },
    search: {
      title: 'Cross-Provider Search',
      placeholder: 'Search across all 49 platforms (DramaBox, NetShort, iQIYI, JoyReels...)...',
      recentSearches: 'Recent Searches',
      trendingSearches: 'Trending Searches',
      removeRecent: 'Remove recent search',
      clearRecent: 'Clear',
      searchingBoth: 'Searching across all 49 live providers...',
      noResults: 'No dramas matched your keyword',
      tryAnother: 'Try another title, genre, or switch language.',
      resultsCount: 'results across providers',
    },
    player: {
      episodes: 'Episodes',
      nextReady: 'Next EP Ready',
      autoNext: 'Auto-Next',
      retry: 'Retry Stream',
      streamUnavailable: 'Stream Unavailable',
      loadingEp: 'Loading Episode',
      watched: 'Watched',
      swipeHint: 'Tap video to show/hide controls · Double-tap edges ±10s',
      quality: 'Quality',
      fullscreen: 'Fullscreen',
      exitFullscreen: 'Exit Fullscreen',
      subtitles: 'Subtitles',
      subtitleTracks: 'Subtitle Track',
      subtitleOff: 'Off',
      noSubtitlesFound: 'No subtitle tracks detected in this stream',
      subtitleStyleLabel: 'Subtitle Style',
      subtitleSize: 'Font Size',
      subtitleColor: 'Text Color',
      subtitleBg: 'Background Opacity',
      commentsTitle: 'Reactions & Comments',
      commentPlaceholder: 'Write a quick reaction about this episode...',
      postComment: 'Post',
      noComments: 'No comments yet. Be the first to react!',
      shareDrama: 'Share',
      skipIntro: 'Skip Intro →',
      pip: 'PiP',
      like: 'Like',
      liked: 'Liked',
      theaterMode: 'Theater Mode',
      exitTheaterMode: 'Exit Theater',
      audioTrack: 'Audio Track',
      offlineCached: 'Offline Ready',
      nextEpisodeIn: 'Next Episode in',
      rewind10s: 'Rewind 10s',
      forward10s: 'Forward 10s',
      zoomFill: 'Fill Screen',
      zoomFit: 'Fit Screen',
      pinchHint: 'Pinch out for Fullscreen · Pinch in to exit',
      saveMovie: 'Save Movie',
      savedMovie: 'In Watchlist',
      saveDrama: 'Save Drama',
      savedDrama: 'Saved',
    },
    auth: {
      signInTitle: 'Sign in with Google',
      signInWithGoogle: 'Sign in with Google to Like & Comment',
      gateReasonDefault:
        'Connect your real Google Account to like dramas, react, post comments, and sync your Daily Watch Streak.',
      gateLikeReason: 'Sign in with Google to Like this drama & save favorites.',
      gateCommentReason:
        'Sign in with Google to post comments & quick reactions.',
      gateWatchlistReason:
        'Sign in with Google to save movies & access your personal Movie Watchlist.',
      continueBtn: 'Sign in with Google',
      signingIn: 'Connecting Google Account...',
      authErrorPopupBlocked:
        'Google Sign-In popup was blocked or closed. Tap "Sign in with Google" below to allow the popup.',
      profileTitle: 'My Account',
      signedInAs: 'Verified Google Account',
      likedCount: 'Liked Dramas',
      savedCount: 'Movie Watchlist',
      dramaWatchlistCount: 'Drama Watchlist',
      openHelpCenter: 'Help Center / FAQ',
      signOut: 'Sign Out',
    },
    watchlistStatus: {
      all: 'All',
      watching: 'Watching',
      plan: 'Plan to Watch',
      completed: 'Completed',
      markCompleted: 'Mark Completed',
      completedBadge: 'Completed',
    },
    engagement: {
      rateTitle: 'Rate this Drama',
      yourRating: 'Your Rating',
      tapToRate: 'Tap stars to rate',
      shareDrama: 'Share Drama',
      generateSpoilerCard: 'Share / Spoiler Card',
      downloadSpoilerCard: 'Download 9:16 PNG Card',
      generatingCard: 'Rendering 9:16 Spoiler Card...',
      spoilerCardReady: '9:16 Spoiler Card Ready',
      shareStoryTitle: 'Spoiler Card Generator',
      copyCaptionLink: 'Copy Viral Caption & Link',
      shareWhatsapp: 'WhatsApp',
      shareTelegram: 'Telegram',
      shareX: 'Share on X',
      shareFacebook: 'Facebook',
      copyLink: 'Copy Link',
      linkCopied: 'Link copied!',
      shareNative: 'Share Card (IG/TikTok)',
      vipUnlockTitle: 'Cliffhanger / VIP Episode Locked',
      vipUnlockDesc:
        'Episodes 1–10 are free! Share this drama with 1 group or friend to unlock this episode free.',
      shareToUnlockBtn: 'Share with 1 Group/Friend to Unlock Free',
      unlockedBadge: 'Unlocked',
      foldersTitle: 'Watchlist Folders',
      createFolder: 'Create Folder',
      folderPlaceholder: 'New folder name...',
      saveToFolder: 'Folder',
      themeTitle: 'Accent Theme',
      contrastLabel: 'UI Contrast',
      highContrast: 'High Contrast',
      standardContrast: 'Standard',
    },
    exploreFilters: {
      allGenres: 'All Genres',
      statusAll: 'All Status',
      statusOngoing: 'Ongoing',
      statusCompleted: 'Completed',
      sortPopular: 'Most Popular',
      sortRating: 'Highest Rated',
      sortNewest: 'Newest',
      searchPlaceholder: 'Filter titles by keyword or trope...',
      resetFilters: 'Reset Filters',
      matchingResults: 'matching titles',
      noFilterMatches: 'No series matched those filters. Try clearing one filter.',
      browseFilteredTitle: 'Filtered Catalog',
    },
    dashboard: {
      title: 'Member Dashboard',
      subtitle: 'Manage your profile, cloud-synced watch progress, watchlist, and reactions.',
      tabProfile: 'Profile & Settings',
      tabWatchlist: 'My Watchlist',
      tabHistory: 'Watch History',
      tabComments: 'My Comments',
      displayNameLabel: 'Display Name',
      bioLabel: 'Bio / Favorite Genres',
      bioPlaceholder: 'Share what tropes you binge most (e.g. CEO, Revenge, Historical)...',
      languageLabel: 'Preferred Catalog Language',
      preferencesLabel: 'Theater Appearance & Preferences',
      saveChanges: 'Save Profile',
      savedSuccess: 'Profile preferences saved!',
      signInRequiredTitle: 'Sync Across Every Device',
      signInRequiredDesc: 'Sign in with Google to customize your profile, sync comments, and keep your Watchlist everywhere.',
      commentsEmpty: 'You have not posted any episode comments yet.',
      historyEmpty: 'No watch history yet. Start any drama to track your progress across devices.',
      jumpToEp: 'Resume Episode',
      streakLabel: 'Watch Streak',
      vipActive: 'VIP House Lover',
      statsWatchlist: 'Saved Series',
      statsHistory: 'Watched Titles',
      statsLiked: 'Liked Series',
      statsComments: 'Comments',
    },
    retention: {
      streakBadge: 'Streak',
      vipCoffeeLover: 'VIP House Lover',
      streakRule: 'Visit & watch 3 consecutive days to unlock VIP House Lover comment badge.',
      streakProgress: 'days to VIP House Lover badge',
      upNextTitle: 'Up Next Drama',
      upNextPlayingIn: 'Starting Episode 1 in',
      playNow: 'Play Now',
      cancel: 'Cancel',
      pushPromptTitle: 'Never Miss New Cliffhangers',
      pushPromptDesc: 'Get browser alerts when trending dramas drop new episodes.',
      pushEnableBtn: 'Enable Alerts',
      pushLaterBtn: 'Later',
      pushEnabledToast: 'Episode alerts enabled!',
    },
    seoTags: {
      popularTagsTitle: 'Browse by Genre & Trope',
      tagLandingSubtitle: 'Live dramas matching this tag across all 49 providers',
      clearTagFilter: 'All Genres',
      genres: [
        'CEO',
        'Revenge',
        'Historical',
        'Dubbed',
        'Romance',
        'Billionaire',
        'Action',
        'Fantasy',
      ],
    },
    help: {
      title: 'Help Center & FAQ',
      subtitle: 'Quick answers for streaming, providers, and account features',
      faqs: [
        {
          q: 'How do I switch between DramaBox and NetShort?',
          a: 'Tap the center Providers button in the mobile bottom navigation bar (or the provider filter pills below the hero spotlight) to browse All Providers, DramaBox, or NetShort.',
        },
        {
          q: 'Why do I need Google Sign-In to Like or Comment?',
          a: 'Browsing and streaming are completely free for guests. Signing in with Google displays your profile name and avatar on episode comments and persists your likes.',
        },
        {
          q: 'How do I unlock VIP-locked episodes for free?',
          a: 'Tap any locked episode and choose "Share with 1 Friend to Unlock Free". Completing the share action unlocks that episode permanently in your browser.',
        },
        {
          q: 'What if a stream fails to load or buffers?',
          a: 'Open the Quality menu in the player to switch resolutions, or tap Retry Stream to reconnect automatically through our high-speed server gateway.',
        },
        {
          q: 'How can I install House Drama as a mobile app?',
          a: 'On Android Chrome, tap the "Install App" button in the header/banner. On iOS Safari, tap Share and select "Add to Home Screen".',
        },
      ],
    },
    pwa: {
      installTitle: 'Install House Drama App',
      installDesc: 'Full-screen vertical cinema & offline poster cache',
      installBenefits: 'Watch faster, full-screen cinema & zero browser bar',
      installBtn: 'Install App',
      installNow: 'Install Now',
      later: 'Maybe Later',
      iosBtn: 'Install App',
      iosGuideTitle: 'Install House Drama on iOS',
      iosTooltip: "Tap Share ↗ in Safari then select 'Add to Home Screen'",
      iosStep1: '1. Tap the Share button in Safari bottom toolbar.',
      iosStep2: '2. Scroll down and select "Add to Home Screen".',
      close: 'Got it',
      offlineBanner: 'Offline Mode — Showing cached library & history.',
      welcomeBadge: 'Welcome to House Drama',
      perkFast: 'Instant Load',
      perkFullscreen: 'Full Screen',
      perkOffline: 'Offline Cache',
      browserInstallHint:
        'Open your browser menu (⋮ or Share) and choose "Install app" or "Add to Home Screen".',
    },
    footer: {
      tagline:
        'Luxury multi-provider Chinese & vertical short drama theater powered by 49+ live platforms.',
      onlineNow: 'Online Now',
      todayVisitors: "Today's Visitors",
      totalVisitors: 'Total Visitors',
      totalViews: 'Total Views',
      linksTitle: 'Platform & Legal',
      about: 'About Us',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      dmca: 'DMCA Disclaimer',
      contact: 'Contact & Partnership',
      helpCenter: 'Help Center / FAQ',
      rights: '© 2026 House Drama. All rights reserved.',
    },
    legal: {
      about: {
        title: 'About House Drama',
        subtitle: 'Luxury Vertical Cinema & Multi-Provider Drama Hub',
        paragraphs: [
          'House Drama curates vertical short dramas, billionaire romance, revenge sagas, and donghua shorts into a unified dark-obsidian streaming theater.',
          'Our unified adapter engine seamlessly normalizes live catalogs from DramaBox and NetShort with synchronized multi-language feeds, adaptive HLS playback, and instant cross-device PWA installation.',
        ],
      },
      privacy: {
        title: 'Privacy Policy',
        subtitle: 'Local-First Watch History & Zero Invasive Tracking',
        paragraphs: [
          'House Drama stores your Google profile session, Watchlist bookmarks, Continue Watching timestamps, likes, ratings, comments, and language preferences strictly inside your browser localStorage.',
          'We do not sell personal viewing habits to third-party ad brokers. Anonymous session heartbeats are used solely to display live concurrent visitor counts.',
        ],
      },
      terms: {
        title: 'Terms of Service',
        subtitle: 'Platform Usage & Streaming Guidelines',
        paragraphs: [
          'House Drama acts as a unified discovery and theater playback interface connecting to authorized third-party short-drama APIs.',
          'Access to VIP-locked episodes remains subject to upstream provider availability. Automated scraping or unauthorized redistribution of stream tokens is prohibited.',
        ],
      },
      dmca: {
        title: 'DMCA / Copyright Disclaimer',
        subtitle: 'Content Rights & Takedown Compliance',
        paragraphs: [
          'House Drama does not host or store video files on its own servers. All posters, metadata, and video streams are delivered dynamically from third-party provider endpoints (DramaBox, NetShort).',
          'Rights holders seeking metadata removal or link restrictions may contact our compliance desk with proof of ownership for prompt review.',
        ],
      },
      contact: {
        title: 'Contact & Partnership',
        subtitle: 'Provider Integrations, Business & Support',
        paragraphs: [
          'Interested in integrating a new short-drama provider adapter or reporting a playback issue? Reach our engineering and partnership team directly below.',
        ],
      },
    },
    contactForm: {
      namePlaceholder: 'Your Name or Studio',
      emailPlaceholder: 'you@domain.com',
      messagePlaceholder: 'Tell us about partnership or feedback...',
      send: 'Send Message',
      sentSuccess: 'Message received! Our partnership team will reply shortly.',
      telegramLabel: 'Telegram Desk',
      emailLabel: 'Official Email',
    },
  },
  id: {
    nav: {
      home: 'Beranda',
      movies: 'Movies',
      explore: 'Jelajahi',
      trending: 'Trending',
      latest: 'Terbaru',
      vip: 'VIP',
      anime: 'Anime',
      dubbed: 'Sulih Suara',
      watchlist: 'Watchlist',
      dashboard: 'Dasbor',
      search: 'Cari',
      providers: 'Providers',
      login: 'Login',
      account: 'Akun',
    },
    moviesPage: {
      title: 'Film & Bioskop HD',
      subtitle: 'Tonton film layar lebar, box office, sinema Asia, dan serial lengkap dalam HD jernih.',
      searchPlaceholder: 'Cari judul film atau serial...',
      allMovies: 'Pilihan Utama',
      latestMovies: 'Film Terbaru',
      categoriesTitle: 'Kategori Film',
      genreFilter: 'Genre',
      countryFilter: 'Negara',
      yearFilter: 'Tahun',
      allOption: 'Semua',
      clearFilters: 'Reset',
      noResults: 'Tidak ada film yang cocok dengan pencarian atau filter ini.',
      loadMore: 'Muat film lainnya',
      titlesCount: 'film',
      watchlistTitle: 'Watchlist Film',
      watchlistSubtitle: 'Koleksi film favorit Anda yang tersimpan aman di akun Anda.',
      watchlistLoginTitle: 'Masuk untuk Mengakses Watchlist Film',
      watchlistLoginDesc: 'Masuk dengan Google untuk menyimpan film favorit dan menyinkronkan Watchlist di semua perangkat.',
      watchlistEmpty: 'Watchlist Film Anda masih kosong. Simpan film apa saja dari menu Movies.',
      browseMoviesBtn: 'Jelajahi Movies',
    },
    providers: {
      all: 'Semua Provider',
      dramaBox: 'DramaBox',
      netShort: 'NetShort',
      anyReel: 'AnyReel',
      melolo: 'Melolo',
      reelShortSoon: 'ReelShort',
      shortMaxSoon: 'ShortMax',
      hubTitle: 'Pusat Provider',
      hubSubtitle: 'Pilih sumber katalog atau cari platform penyedia',
      searchPlaceholder: 'Cari provider...',
      activeLabel: 'Aktif',
      titlesLoaded: 'judul',
      comingSoon: 'Segera Hadir',
      noMatches: 'Provider tidak ditemukan',
    },
    hero: {
      featured: 'Pilihan Utama',
      playNow: 'Tonton Sekarang',
      viewDetails: 'Lihat Detail',
      addToList: 'Tambah ke Daftar',
      inList: 'Tersimpan',
    },
    sections: {
      continueWatching: 'Lanjutkan Menonton',
      trendingNow: 'Trending di House Drama',
      recommended: 'Rekomendasi Untuk Kamu',
      newReleases: 'Rilis Terbaru',
      vipExclusives: 'Eksklusif VIP',
      animeDonghua: 'Anime & Donghua Pendek',
      dubbedSeries: 'Sulih Suara Indonesia',
      netShortTrending: 'Populer di NetShort',
      anyReelAsian: 'AnyReel Asian & Pilihan',
      meloloTrending: 'Populer di Melolo',
      viewAll: 'Lihat semua',
      loadMore: 'Muat lagi',
      loading: 'Memuat...',
      resumeEp: 'Lanjut Ep',
      removeHistory: 'Hapus dari riwayat',
      backToHome: 'Kembali ke Beranda',
      backToBrowse: 'Kembali',
      hotPicks: 'Pilihan Populer & Terbaru',
      homeCatalogGrid: 'Katalog Utama',
      exploreTitle: 'Jelajahi Semua Kategori',
      exploreSubtitle: 'Temukan sorotan dari seluruh provider, anime, sulih suara, hingga rilis terbaru.',
      exploreAllCategories: 'Jelajahi Semua Kategori',
      exploreMoreProviders: 'Muat Provider Lainnya',
      pickedForYou: 'Pilihan Khusus Untukmu',
      becauseYouWatched: 'Karena Kamu Menonton',
      dramaWatchlistTitle: 'Watchlist Drama',
      dramaWatchlistSubtitle: 'Daftar serial drama & short reel favorit yang Anda simpan.',
      dramaWatchlistEmpty: 'Watchlist Drama masih kosong. Simpan serial drama favorit untuk ditonton nanti.',
      exploreDramasBtn: 'Jelajahi Drama',
    },
    search: {
      title: 'Pencarian Lintas Provider',
      placeholder: 'Cari drama di 49 platform (DramaBox, NetShort, iQIYI, JoyReels...)...',
      recentSearches: 'Pencarian Terakhir',
      trendingSearches: 'Pencarian Populer',
      removeRecent: 'Hapus pencarian ini',
      clearRecent: 'Hapus',
      searchingBoth: 'Mencari di seluruh 49 provider aktif...',
      noResults: 'Drama tidak ditemukan',
      tryAnother: 'Coba kata kunci lain atau ubah bahasa katalog.',
      resultsCount: 'hasil lintas provider',
    },
    player: {
      episodes: 'Daftar Episode',
      nextReady: 'Ep Berikutnya Siap',
      autoNext: 'Putar Otomatis',
      retry: 'Coba Lagi',
      streamUnavailable: 'Stream Tidak Tersedia',
      loadingEp: 'Memuat Episode',
      watched: 'Ditonton',
      swipeHint: 'Ketuk layar untuk tampil/sembunyikan kontrol · Ketuk 2x ±10 dtk',
      quality: 'Kualitas',
      fullscreen: 'Layar Penuh',
      exitFullscreen: 'Keluar Layar Penuh',
      subtitles: 'CC / Subtitle',
      subtitleTracks: 'Pilih Bahasa Subtitle',
      subtitleOff: 'Mati (Off)',
      noSubtitlesFound: 'Tidak ada trek subtitle pada video ini',
      subtitleStyleLabel: 'Tampilan Teks',
      subtitleSize: 'Ukuran Teks',
      subtitleColor: 'Warna Teks',
      subtitleBg: 'Opasitas Latar',
      commentsTitle: 'Reaksi & Komentar',
      commentPlaceholder: 'Tulis komentarmu tentang episode ini...',
      postComment: 'Kirim',
      noComments: 'Belum ada komentar. Jadilah yang pertama!',
      shareDrama: 'Bagikan',
      skipIntro: 'Lewati Intro →',
      pip: 'PiP',
      like: 'Suka',
      liked: 'Disukai',
      theaterMode: 'Mode Teater',
      exitTheaterMode: 'Keluar Teater',
      audioTrack: 'Trek Audio',
      offlineCached: 'Tersimpan Offline',
      nextEpisodeIn: 'Episode Berikutnya',
      rewind10s: 'Mundur 10 dtk',
      forward10s: 'Maju 10 dtk',
      zoomFill: 'Penuhi Layar',
      zoomFit: 'Sesuaikan Layar',
      pinchHint: 'Cubit keluar untuk Layar Penuh · Cubit masuk untuk kembali normal',
      saveMovie: 'Simpan Film',
      savedMovie: 'Di Watchlist',
      saveDrama: 'Simpan Drama',
      savedDrama: 'Tersimpan',
    },
    auth: {
      signInTitle: 'Masuk dengan Google',
      signInWithGoogle: 'Masuk dengan Google untuk Suka & Komentar',
      gateReasonDefault:
        'Hubungkan akun Google asli Anda untuk menyukai drama, memberi reaksi, berkomentar, dan menyimpan Streak Harian.',
      gateLikeReason: 'Masuk dengan Google untuk menyukai drama ini.',
      gateCommentReason:
        'Masuk dengan Google untuk mengirim komentar & reaksi cepat.',
      gateWatchlistReason:
        'Masuk dengan Google untuk menyimpan film ke Watchlist Film Anda.',
      continueBtn: 'Masuk dengan Google',
      signingIn: 'Menghubungkan Akun Google...',
      authErrorPopupBlocked:
        'Popup Login Google diblokir atau ditutup. Tekan tombol "Masuk dengan Google" di bawah untuk melanjutkan.',
      profileTitle: 'Akun Saya',
      signedInAs: 'Akun Google Terverifikasi',
      likedCount: 'Drama Disukai',
      savedCount: 'Watchlist Film',
      dramaWatchlistCount: 'Watchlist Drama',
      openHelpCenter: 'Pusat Bantuan / FAQ',
      signOut: 'Keluar Akun',
    },
    watchlistStatus: {
      all: 'Semua',
      watching: 'Sedang Ditonton',
      plan: 'Belum Dimulai',
      completed: 'Selesai',
      markCompleted: 'Tandai Selesai',
      completedBadge: 'Selesai',
    },
    engagement: {
      rateTitle: 'Beri Rating Drama',
      yourRating: 'Rating Kamu',
      tapToRate: 'Ketuk bintang untuk menilai',
      shareDrama: 'Bagikan Drama',
      generateSpoilerCard: 'Buat Kartu Spoiler / Share',
      downloadSpoilerCard: 'Unduh Kartu PNG 9:16',
      generatingCard: 'Membuat Kartu Spoiler 9:16...',
      spoilerCardReady: 'Kartu Spoiler 9:16 Siap',
      shareStoryTitle: 'Generator Kartu Spoiler',
      copyCaptionLink: 'Salin Caption Viral & Link',
      shareWhatsapp: 'WhatsApp',
      shareTelegram: 'Telegram',
      shareX: 'Bagikan ke X',
      shareFacebook: 'Facebook',
      copyLink: 'Salin Link',
      linkCopied: 'Link disalin!',
      shareNative: 'Bagikan (IG / TikTok)',
      vipUnlockTitle: 'Episode Cliffhanger / VIP Terkunci',
      vipUnlockDesc:
        'Episode 1–10 gratis! Bagikan drama ini ke 1 Grup atau Teman untuk membuka episode ini secara gratis.',
      shareToUnlockBtn: 'Bagikan ke 1 Grup/Teman untuk Buka Gratis',
      unlockedBadge: 'Terbuka',
      foldersTitle: 'Folder Daftar Tontonan',
      createFolder: 'Buat Folder',
      folderPlaceholder: 'Nama folder baru...',
      saveToFolder: 'Folder',
      themeTitle: 'Tema Aksen',
      contrastLabel: 'Kontras UI',
      highContrast: 'Kontras Tinggi',
      standardContrast: 'Standar',
    },
    exploreFilters: {
      allGenres: 'Semua Genre',
      statusAll: 'Semua Status',
      statusOngoing: 'Ongoing',
      statusCompleted: 'Tamat',
      sortPopular: 'Paling Populer',
      sortRating: 'Rating Tertinggi',
      sortNewest: 'Terbaru',
      searchPlaceholder: 'Filter judul atau kata kunci...',
      resetFilters: 'Reset Filter',
      matchingResults: 'judul ditemukan',
      noFilterMatches: 'Belum ada drama yang cocok dengan filter ini.',
      browseFilteredTitle: 'Hasil Filter Katalog',
    },
    dashboard: {
      title: 'Dasbor Pengguna',
      subtitle: 'Kelola profil, sinkronisasi riwayat tontonan, daftar saya, dan komentar Anda.',
      tabProfile: 'Profil & Preferensi',
      tabWatchlist: 'Daftar Saya',
      tabHistory: 'Riwayat Tontonan',
      tabComments: 'Riwayat Komentar',
      displayNameLabel: 'Nama Tampilan',
      bioLabel: 'Bio / Genre Favorit',
      bioPlaceholder: 'Tulis genre favoritmu (misal CEO, Balas Dendam, Romansa)...',
      languageLabel: 'Bahasa Katalog Utama',
      preferencesLabel: 'Tampilan Teater & Preferensi',
      saveChanges: 'Simpan Profil',
      savedSuccess: 'Profil & preferensi tersimpan!',
      signInRequiredTitle: 'Sinkronisasi Lintas Perangkat',
      signInRequiredDesc: 'Masuk dengan Google untuk mengelola profil, komentar, dan daftar tontonan antar perangkat.',
      commentsEmpty: 'Kamu belum mengirim komentar episode.',
      historyEmpty: 'Belum ada riwayat tontonan. Tonton drama apa saja untuk menyimpannya di cloud.',
      jumpToEp: 'Lanjut Episode',
      streakLabel: 'Streak Harian',
      vipActive: 'VIP House Lover',
      statsWatchlist: 'Daftar Saya',
      statsHistory: 'Ditonton',
      statsLiked: 'Disukai',
      statsComments: 'Komentar',
    },
    retention: {
      streakBadge: 'Streak',
      vipCoffeeLover: 'VIP House Lover',
      streakRule: 'Tonton 3 hari berturut-turut untuk mendapatkan lencana VIP House Lover di komentar.',
      streakProgress: 'hari lagi menuju lencana VIP House Lover',
      upNextTitle: 'Drama Berikutnya',
      upNextPlayingIn: 'Memutar Episode 1 dalam',
      playNow: 'Putar Sekarang',
      cancel: 'Batal',
      pushPromptTitle: 'Jangan Ketinggalan Episode Baru',
      pushPromptDesc: 'Aktifkan notifikasi browser saat drama populer merilis episode terbaru.',
      pushEnableBtn: 'Aktifkan Notifikasi',
      pushLaterBtn: 'Nanti',
      pushEnabledToast: 'Notifikasi episode diaktifkan!',
    },
    seoTags: {
      popularTagsTitle: 'Jelajahi Genre & Tema Populer',
      tagLandingSubtitle: 'Drama pilihan sesuai tag dari seluruh 49 provider aktif',
      clearTagFilter: 'Semua Genre',
      genres: [
        'CEO',
        'Balas Dendam',
        'Kerajaan',
        'Sulih Suara',
        'Romance',
        'Billionaire',
        'Revenge',
        'Fantasy',
      ],
    },
    help: {
      title: 'Pusat Bantuan & FAQ',
      subtitle: 'Panduan cepat pemutaran video, provider, dan akun Google',
      faqs: [
        {
          q: 'Bagaimana cara berpindah antara DramaBox dan NetShort?',
          a: 'Ketuk tombol Providers di tengah bilah navigasi bawah (atau filter provider di bawah banner utama) untuk memilih Semua Provider, DramaBox, atau NetShort.',
        },
        {
          q: 'Mengapa harus Login Google untuk Suka & Komentar?',
          a: 'Menonton drama sepenuhnya gratis tanpa login. Login Google diperlukan agar nama dan foto profil Anda muncul pada komentar serta menyimpan daftar drama favorit.',
        },
        {
          q: 'Bagaimana cara membuka episode VIP secara gratis?',
          a: 'Ketuk episode bertanda gembok VIP lalu pilih "Bagikan ke 1 Teman untuk Buka Gratis". Setelah dibagikan, episode langsung terbuka otomatis.',
        },
        {
          q: 'Apa yang dilakukan tombol Lewati Intro & PiP?',
          a: 'Tombol "Lewati Intro →" muncul di 30 detik awal untuk melompati pembukaan (+15 detik). Tombol PiP memungkinkan Anda menonton di jendela mengambang.',
        },
        {
          q: 'Bagaimana cara pasang aplikasi House Drama (PWA)?',
          a: 'Di Chrome Android ketuk "Pasang App". Di Safari iOS ketuk tombol Bagikan lalu pilih "Tambahkan ke Layar Utama".',
        },
      ],
    },
    pwa: {
      installTitle: 'Install House Drama App',
      installDesc: 'Nonton lebih cepat & tanpa bar browser',
      installBenefits: 'Nonton lebih cepat, layar penuh & tanpa bar browser',
      installBtn: 'Pasang App',
      installNow: 'Install Sekarang',
      later: 'Nanti Saja',
      iosBtn: 'Pasang App',
      iosGuideTitle: 'Pasang House Drama di iOS',
      iosTooltip: "Ketuk tombol Bagikan ↗ lalu pilih 'Tambahkan ke Layar Utama'",
      iosStep1: '1. Ketuk tombol Bagikan (Share) di bilah bawah Safari.',
      iosStep2: '2. Gulir ke bawah lalu pilih "Tambahkan ke Layar Utama".',
      close: 'Mengerti',
      offlineBanner: 'Mode Offline — Menampilkan daftar & riwayat tersimpan.',
      welcomeBadge: 'Selamat Datang di House Drama',
      perkFast: 'Akses Cepat',
      perkFullscreen: 'Layar Penuh',
      perkOffline: 'Cache Offline',
      browserInstallHint:
        'Buka menu browser (⋮ atau Bagikan) lalu pilih "Install aplikasi" atau "Tambahkan ke Layar Utama".',
    },
    footer: {
      tagline:
        'Platform streaming drama vertikal & drama Tiongkok multi-provider dari 49+ sumber resmi.',
      onlineNow: 'Sedang Online',
      todayVisitors: 'Pengunjung Hari Ini',
      totalVisitors: 'Total Pengunjung',
      totalViews: 'Total Tayangan',
      linksTitle: 'Informasi & Legal',
      about: 'Tentang House Drama',
      privacy: 'Kebijakan Privasi',
      terms: 'Syarat & Ketentuan',
      dmca: 'Penafian DMCA',
      contact: 'Kontak & Kemitraan',
      helpCenter: 'Pusat Bantuan / FAQ',
      rights: '© 2026 House Drama. Hak cipta dilindungi.',
    },
    legal: {
      about: {
        title: 'Tentang House Drama',
        subtitle: 'Bioskop Vertikal Mewah & Hub Drama Multi-Provider',
        paragraphs: [
          'House Drama menghadirkan drama pendek vertikal, romansa CEO, kisah balas dendam, hingga donghua pendek dalam satu antarmuka bioskop gelap yang nyaman.',
          'Mesin adaptor kami menyinkronkan katalog langsung dari DramaBox dan NetShort dengan pilihan bahasa otomatis, pemutaran adaptif HLS, dan dukungan aplikasi PWA.',
        ],
      },
      privacy: {
        title: 'Kebijakan Privasi',
        subtitle: 'Penyimpanan Riwayat Lokal Tanpa Pelacakan Berlebih',
        paragraphs: [
          'House Drama menyimpan sesi profil Google, Daftar Tontonan, posisi detik terakhir Lanjutkan Menonton, suka, rating, komentar, serta preferensi bahasa langsung di localStorage perangkat Anda.',
          'Kami tidak menjual data kebiasaan menonton kepada pihak ketiga. Detak sesi anonim hanya dipakai untuk menghitung jumlah pengunjung aktif secara real-time.',
        ],
      },
      terms: {
        title: 'Syarat & Ketentuan',
        subtitle: 'Ketentuan Layanan & Streaming',
        paragraphs: [
          'House Drama berfungsi sebagai antarmuka penjelajahan dan pemutar video yang terhubung ke API penyedia drama resmi.',
          'Ketersediaan episode VIP mengikuti kebijakan penyedia sumber masing-masing. Pengambilan data otomatis tanpa izin tidak diperbolehkan.',
        ],
      },
      dmca: {
        title: 'Penafian DMCA / Hak Cipta',
        subtitle: 'Kepatuhan Hak Cipta & Laporan Konten',
        paragraphs: [
          'House Drama tidak menyimpan file video di server lokal kami. Seluruh poster, sinopsis, dan aliran video disalurkan langsung dari API pihak ketiga (DramaBox & NetShort).',
          'Pemegang hak cipta dapat menghubungi tim kami dengan bukti kepemilikan sah untuk peninjauan segera.',
        ],
      },
      contact: {
        title: 'Kontak & Kemitraan',
        subtitle: 'Integrasi Provider, Kerja Sama & Bantuan',
        paragraphs: [
          'Ingin bermitra atau melaporkan kendala pemutaran drama? Hubungi tim teknis dan kemitraan kami melalui formulir di bawah ini.',
        ],
      },
    },
    contactForm: {
      namePlaceholder: 'Nama Anda atau Studio',
      emailPlaceholder: 'email@domain.com',
      messagePlaceholder: 'Tulis pesan kerja sama atau masukan...',
      send: 'Kirim Pesan',
      sentSuccess: 'Pesan terkirim! Tim kemitraan kami akan segera merespons.',
      telegramLabel: 'Telegram Resmi',
      emailLabel: 'Email Resmi',
    },
  },
  cn: {
    nav: {
      home: '首页',
      movies: '电影',
      explore: '探索发现',
      trending: '热播榜',
      latest: '最新上线',
      vip: 'VIP 尊享',
      anime: '动漫短剧',
      dubbed: '配音专区',
      watchlist: '追剧片单',
      dashboard: '用户中心',
      search: '搜索',
      providers: '片源中心',
      login: '登录',
      account: '账户',
    },
    moviesPage: {
      title: '电影影院',
      subtitle: '高清畅看院线大片、亚洲电影与热门剧集。',
      searchPlaceholder: '搜索电影或剧集名称...',
      allMovies: '精选推荐',
      latestMovies: '最新电影',
      categoriesTitle: '分类浏览',
      genreFilter: '类型',
      countryFilter: '国家/地区',
      yearFilter: '年份',
      allOption: '全部',
      clearFilters: '重置',
      noResults: '未找到符合条件的电影。',
      loadMore: '加载更多电影',
      titlesCount: '部电影',
      watchlistTitle: '电影片单',
      watchlistSubtitle: '已登录账户专属同步保存的电影收藏清单。',
      watchlistLoginTitle: '登录查看电影片单',
      watchlistLoginDesc: '使用 Google 登录后即可保存喜爱电影并跨设备云端同步。',
      watchlistEmpty: '电影片单为空，前往电影频道收藏喜欢的影片。',
      browseMoviesBtn: '浏览电影',
    },
    providers: {
      all: '全部片源',
      dramaBox: 'DramaBox',
      netShort: 'NetShort',
      anyReel: 'AnyReel',
      melolo: 'Melolo',
      reelShortSoon: 'ReelShort',
      shortMaxSoon: 'ShortMax',
      hubTitle: '片源中心',
      hubSubtitle: '即时切换平台或搜索授权短剧片源',
      searchPlaceholder: '搜索片源...',
      activeLabel: '当前选中',
      titlesLoaded: '部剧集',
      comingSoon: '敬请期待',
      noMatches: '未找到匹配的片源',
    },
    hero: {
      featured: '重磅推荐',
      playNow: '立即观看',
      viewDetails: '查看详情',
      addToList: '加入片单',
      inList: '已收藏',
    },
    sections: {
      continueWatching: '继续观看',
      trendingNow: 'House Drama 热播榜',
      recommended: '猜你喜欢',
      newReleases: '每日上新',
      vipExclusives: 'VIP 独播精选',
      animeDonghua: '国漫 / 动画短剧',
      dubbedSeries: '配音剧场',
      netShortTrending: 'NetShort 热门',
      anyReelAsian: 'AnyReel 亚洲热剧',
      meloloTrending: 'Melolo 热播榜',
      viewAll: '查看全部',
      loadMore: '加载更多',
      loading: '加载中...',
      resumeEp: '续看第',
      removeHistory: '移出记录',
      backToHome: '返回首页',
      backToBrowse: '返回浏览',
      hotPicks: '热门与新剧精选',
      homeCatalogGrid: '精选片库',
      exploreTitle: '探索全部分类',
      exploreSubtitle: '浏览全部片源专区、动漫短剧、配音剧场与最新上架内容。',
      exploreAllCategories: '探索全部分类',
      exploreMoreProviders: '加载更多片源',
      pickedForYou: '为你精选推荐',
      becauseYouWatched: '因为你看过',
      dramaWatchlistTitle: '短剧片单',
      dramaWatchlistSubtitle: '收藏保存您喜爱的连续短剧。',
      dramaWatchlistEmpty: '短剧片单为空，点击任意剧集的收藏按钮即可保存。',
      exploreDramasBtn: '浏览短剧',
    },
    search: {
      title: '全平台跨源搜索',
      placeholder: '全网同步搜索 49 大短剧片源（DramaBox、NetShort、iQIYI、JoyReels 等）...',
      recentSearches: '最近搜索',
      trendingSearches: '热门搜索',
      removeRecent: '移除搜索记录',
      clearRecent: '清空',
      searchingBoth: '正在同步搜索全部 49 个短剧平台...',
      noResults: '未找到相关剧集',
      tryAnother: '请尝试更换关键词或切换语言。',
      resultsCount: '条跨平台结果',
    },
    player: {
      episodes: '选集列表',
      nextReady: '下集已预载',
      autoNext: '自动连播',
      retry: '重新加载',
      streamUnavailable: '视频源暂不可用',
      loadingEp: '正在加载第',
      watched: '已看',
      swipeHint: '点击屏幕显示或隐藏控制栏 · 双击左右快退/快进 10 秒',
      quality: '画质',
      fullscreen: '全屏',
      exitFullscreen: '退出全屏',
      subtitles: 'CC / 字幕设置',
      subtitleTracks: '字幕语言',
      subtitleOff: '关闭字幕',
      noSubtitlesFound: '当前视频流暂未检测到可用字幕轨',
      subtitleStyleLabel: '字幕外观',
      subtitleSize: '字体大小',
      subtitleColor: '文字颜色',
      subtitleBg: '背景透明度',
      commentsTitle: '实时互动与短评',
      commentPlaceholder: '发表本集短评...',
      postComment: '发送',
      noComments: '暂无评论，快来抢沙发！',
      shareDrama: '分享',
      skipIntro: '跳过片头 →',
      pip: '画中画',
      like: '喜欢',
      liked: '已喜欢',
      theaterMode: '影院模式',
      exitTheaterMode: '退出影院',
      audioTrack: '音轨语言',
      offlineCached: '已离线缓存',
      nextEpisodeIn: '即将播放下一集',
      rewind10s: '快退 10 秒',
      forward10s: '快进 10 秒',
      zoomFill: '铺满屏幕',
      zoomFit: '适应画面',
      pinchHint: '双指张开全屏 · 双指捏合退出全屏',
      saveMovie: '收藏电影',
      savedMovie: '已加片单',
      saveDrama: '收藏短剧',
      savedDrama: '已收藏',
    },
    auth: {
      signInTitle: '使用 Google 登录',
      signInWithGoogle: '登录 Google 账户即可点赞与评论',
      gateReasonDefault: '绑定您的真实 Google 账户以点赞剧集、发表短评并累计每日追剧连续打卡。',
      gateLikeReason: '使用 Google 登录后即可点赞并收藏喜爱剧集。',
      gateCommentReason: '使用 Google 登录后即可发表集数短评与表情互动。',
      gateWatchlistReason: '使用 Google 登录后即可保存电影并查看个人电影片单。',
      continueBtn: '使用 Google 登录',
      signingIn: '正在连接 Google 账户...',
      authErrorPopupBlocked: 'Google 登录弹窗被拦截或已关闭，请点击下方按钮重试。',
      profileTitle: '个人中心',
      signedInAs: '已验证 Google 账户',
      likedCount: '点赞剧集',
      savedCount: '电影片单',
      dramaWatchlistCount: '短剧片单',
      openHelpCenter: '帮助中心 / FAQ',
      signOut: '退出登录',
    },
    watchlistStatus: {
      all: '全部',
      watching: '正在追剧',
      plan: '尚未开始',
      completed: '已看完',
      markCompleted: '标记看完',
      completedBadge: '已看完',
    },
    engagement: {
      rateTitle: '为剧集评分',
      yourRating: '您的评分',
      tapToRate: '点击星星评分',
      shareDrama: '分享剧集',
      generateSpoilerCard: '生成剧透分享卡 / 分享',
      downloadSpoilerCard: '下载 9:16 PNG 海报卡',
      generatingCard: '正在生成 9:16 剧透分享卡...',
      spoilerCardReady: '9:16 剧透海报卡已就绪',
      shareStoryTitle: '剧透海报卡生成器',
      copyCaptionLink: '复制爆款文案与链接',
      shareWhatsapp: 'WhatsApp',
      shareTelegram: 'Telegram',
      shareX: '分享至 X',
      shareFacebook: 'Facebook',
      copyLink: '复制链接',
      linkCopied: '已复制链接!',
      shareNative: '分享海报卡 (IG/TikTok)',
      vipUnlockTitle: 'VIP 剧集已锁定',
      vipUnlockDesc: '第 1–10 集免费观看！分享给 1 位好友或群聊即可免费解锁本集。',
      shareToUnlockBtn: '分享给 1 位好友/群聊免费解锁',
      unlockedBadge: '已解锁',
      foldersTitle: '追剧分组文件夹',
      createFolder: '新建分组',
      folderPlaceholder: '输入新分组名称...',
      saveToFolder: '分组',
      themeTitle: '主题配色',
      contrastLabel: '界面对比度',
      highContrast: '高对比度',
      standardContrast: '标准暗黑',
    },
    exploreFilters: {
      allGenres: '全部题材',
      statusAll: '全部状态',
      statusOngoing: '连载中',
      statusCompleted: '已完结',
      sortPopular: '热度最高',
      sortRating: '评分最高',
      sortNewest: '最新上线',
      searchPlaceholder: '输入剧名或关键词筛选...',
      resetFilters: '重置筛选',
      matchingResults: '部匹配剧集',
      noFilterMatches: '暂无符合当前筛选条件的短剧。',
      browseFilteredTitle: '筛选片库结果',
    },
    dashboard: {
      title: '用户中心',
      subtitle: '管理个人资料、云端观影进度、追剧片单与历史评论。',
      tabProfile: '资料与偏好',
      tabWatchlist: '我的追剧',
      tabHistory: '观看历史',
      tabComments: '我的评论',
      displayNameLabel: '显示昵称',
      bioLabel: '个人简介 / 偏好题材',
      bioPlaceholder: '填写您最喜欢的题材（例如总裁、复仇、古风）...',
      languageLabel: '默认片库语言',
      preferencesLabel: '影院外观与偏好',
      saveChanges: '保存设置',
      savedSuccess: '个人资料与偏好已保存!',
      signInRequiredTitle: '多设备云端同步',
      signInRequiredDesc: '使用 Google 登录后即可跨设备同步个人资料、追剧清单和评论历史。',
      commentsEmpty: '您尚未发表任何剧集评论。',
      historyEmpty: '暂无观看历史，立即开始任意短剧吧。',
      jumpToEp: '续看第',
      streakLabel: '连续打卡',
      vipActive: 'VIP House Lover',
      statsWatchlist: '收藏剧集',
      statsHistory: '观看记录',
      statsLiked: '点赞剧集',
      statsComments: '评论数',
    },
    retention: {
      streakBadge: '连看',
      vipCoffeeLover: 'VIP House Lover',
      streakRule: '连续 3 天访问并观影即可获得评论区专属 VIP House Lover 徽章。',
      streakProgress: '天后解锁 VIP House Lover 徽章',
      upNextTitle: '下一部推荐',
      upNextPlayingIn: '即将播放第 1 集',
      playNow: '立即播放',
      cancel: '取消',
      pushPromptTitle: '第一时间获取新集提醒',
      pushPromptDesc: '开启浏览器通知，热门短剧更新高能剧情时立即提醒。',
      pushEnableBtn: '开启通知',
      pushLaterBtn: '稍后再说',
      pushEnabledToast: '更新提醒已开启！',
    },
    seoTags: {
      popularTagsTitle: '按题材与标签浏览',
      tagLandingSubtitle: '来自 49 个片源平台的精选标签剧集',
      clearTagFilter: '全部题材',
      genres: [
        'CEO',
        'Balas Dendam',
        'Kerajaan',
        'Sulih Suara',
        'Romance',
        'Billionaire',
        'Revenge',
        'Fantasy',
      ],
    },
    help: {
      title: '帮助中心与常见问题',
      subtitle: '关于片源切换、Google 登录及播放功能的使用说明',
      faqs: [
        {
          q: '如何切换 DramaBox 与 NetShort 片源？',
          a: '点击底部导航栏中间的“片源中心”按钮（或首页海报下方的片源标签），即可随时切换全平台、DramaBox 或 NetShort 目录。',
        },
        {
          q: '为什么点赞和评论需要 Google 登录？',
          a: '游客可以免费浏览与观看剧集；登录 Google 账户后，系统会在评论区展示您的头像和名称，并持久保存点赞记录。',
        },
        {
          q: '如何免费解锁 VIP 剧集？',
          a: '点击带有 VIP 锁标识的剧集并选择“分享给 1 位好友免费解锁”，完成分享后即可立即免费观看。',
        },
        {
          q: '跳过片头和画中画 (PiP) 如何使用？',
          a: '在每集前 30 秒播放时会出现“跳过片头 →”按钮，点击可快进 15 秒；点击画中画图标可在悬浮小窗继续播放。',
        },
        {
          q: '如何安装 House Drama 为手机应用？',
          a: 'Android Chrome 用户可点击“安装应用”；iOS Safari 用户点击“分享”后选择“添加到主屏幕”。',
        },
      ],
    },
    pwa: {
      installTitle: '安装 House Drama 应用',
      installDesc: '支持全屏竖屏影院体验与海报离线缓存',
      installBenefits: '更流畅观影、全屏无浏览器地址栏干扰',
      installBtn: '安装应用',
      installNow: '立即安装',
      later: '稍后再说',
      iosBtn: '安装应用',
      iosGuideTitle: '在 iOS 上安装 House Drama',
      iosTooltip: '点击底部分享按钮 ↗ 然后选择“添加到主屏幕”',
      iosStep1: '1. 点击 Safari 底部工具栏的“分享”按钮。',
      iosStep2: '2. 向下滚动并选择“添加到主屏幕”。',
      close: '知道了',
      offlineBanner: '离线模式 — 当前展示本地缓存片单与历史记录。',
      welcomeBadge: '欢迎来到 House Drama',
      perkFast: '极速秒开',
      perkFullscreen: '沉浸全屏',
      perkOffline: '离线缓存',
      browserInstallHint:
        '请点击浏览器菜单（⋮ 或分享）并选择“安装应用”或“添加到主屏幕”。',
    },
    footer: {
      tagline: '聚合 49+ 授权短剧片源的奢华竖屏微短剧流媒体平台。',
      onlineNow: '当前在线',
      todayVisitors: '今日访客',
      totalVisitors: '总访客数',
      totalViews: '累计观看',
      linksTitle: '平台与法律条款',
      about: '关于我们',
      privacy: '隐私政策',
      terms: '服务条款',
      dmca: 'DMCA 版权声明',
      contact: '联系与合作',
      helpCenter: '帮助中心 / FAQ',
      rights: '© 2026 House Drama. 保留所有权利。',
    },
    legal: {
      about: {
        title: '关于 House Drama',
        subtitle: '多片源竖屏微短剧奢华影院',
        paragraphs: [
          'House Drama 汇集都市霸总、重生逆袭、奇幻言情与国漫微短剧，提供沉浸式暗黑美学观影体验。',
          '我们的统一适配器引擎实时同步 DramaBox 与 NetShort 接口数据，支持多语言切换、HLS 自适应播放与 PWA 桌面安装。',
        ],
      },
      privacy: {
        title: '隐私政策',
        subtitle: '本地优先存储 · 零侵入式追踪',
        paragraphs: [
          'House Drama 仅将您的 Google 会话资料、收藏列表、续播秒数进度、点赞、评分评论与语言偏好保存在本地浏览器的 localStorage 中。',
          '我们不会向任何第三方出售个人观影习惯。匿名会话心跳仅用于展示实时在线人数统计。',
        ],
      },
      terms: {
        title: '服务条款',
        subtitle: '使用规范与流媒体说明',
        paragraphs: [
          'House Drama 作为聚合发现与影院播放界面，连接至授权的第三方短剧内容接口。',
          'VIP 剧集的观看权限遵循上游片源平台规则。禁止未经授权的批量抓取或滥用接口令牌。',
        ],
      },
      dmca: {
        title: 'DMCA 版权声明',
        subtitle: '知识产权与合规处理',
        paragraphs: [
          'House Drama 本身不存储任何视频文件，所有海报、剧集简介及播放地址均实时来源于第三方片源接口（DramaBox、NetShort）。',
          '若版权方发现相关元数据问题，请通过合作联系渠道提交权属证明以便及时处理。',
        ],
      },
      contact: {
        title: '联系与商务合作',
        subtitle: '片源接入、技术支持与商务咨询',
        paragraphs: [
          '欢迎短剧发行方、内容提供商及合作伙伴通过下方表单或官方渠道与我们取得联系。',
        ],
      },
    },
    contactForm: {
      namePlaceholder: '您的姓名或工作室名称',
      emailPlaceholder: 'you@domain.com',
      messagePlaceholder: '请输入合作意向或反馈建议...',
      send: '发送消息',
      sentSuccess: '消息已收到！我们的团队会尽快与您联系。',
      telegramLabel: '官方 Telegram',
      emailLabel: '官方邮箱',
    },
  },
  vi: {
    nav: {
      home: 'Trang chủ',
      movies: 'Phim lẻ',
      explore: 'Khám phá',
      trending: 'Thịnh hành',
      latest: 'Mới nhất',
      vip: 'VIP',
      anime: 'Hoạt hình',
      dubbed: 'Lồng tiếng',
      watchlist: 'Danh sách xem',
      dashboard: 'Bảng điều khiển',
      search: 'Tìm kiếm',
      providers: 'Nguồn phim',
      login: 'Đăng nhập',
      account: 'Tài khoản',
    },
    moviesPage: {
      title: 'Phim Chiếu Rạp HD',
      subtitle: 'Xem phim điện ảnh, bom tấn chiếu rạp, phim châu Á và series trọn bộ sắc nét.',
      searchPlaceholder: 'Tìm tên phim hoặc series...',
      allMovies: 'Phim Nổi Bật',
      latestMovies: 'Phim Mới Nhất',
      categoriesTitle: 'Danh mục Phim',
      genreFilter: 'Thể loại',
      countryFilter: 'Quốc gia',
      yearFilter: 'Năm',
      allOption: 'Tất cả',
      clearFilters: 'Đặt lại',
      noResults: 'Không tìm thấy phim phù hợp.',
      loadMore: 'Tải thêm phim',
      titlesCount: 'phim',
      watchlistTitle: 'Danh sách Phim',
      watchlistSubtitle: 'Bộ sưu tập phim đã lưu đồng bộ theo tài khoản của bạn.',
      watchlistLoginTitle: 'Đăng nhập để xem Danh sách Phim',
      watchlistLoginDesc: 'Đăng nhập Google để lưu phim yêu thích và đồng bộ trên mọi thiết bị.',
      watchlistEmpty: 'Danh sách Phim đang trống. Hãy lưu phim từ mục Phim lẻ.',
      browseMoviesBtn: 'Khám phá Phim',
    },
    providers: {
      all: 'Tất cả nguồn',
      dramaBox: 'DramaBox',
      netShort: 'NetShort',
      anyReel: 'AnyReel',
      melolo: 'Melolo',
      reelShortSoon: 'ReelShort',
      shortMaxSoon: 'ShortMax',
      hubTitle: 'Trung tâm Nguồn phim',
      hubSubtitle: 'Chuyển đổi danh mục hoặc tìm kiếm trên các nền tảng',
      searchPlaceholder: 'Tìm nguồn phim...',
      activeLabel: 'Đang dùng',
      titlesLoaded: 'bộ phim',
      comingSoon: 'Sắp ra mắt',
      noMatches: 'Không tìm thấy nguồn phim phù hợp',
    },
    hero: {
      featured: 'Đề xuất nổi bật',
      playNow: 'Xem ngay',
      viewDetails: 'Chi tiết',
      addToList: 'Lưu vào danh sách',
      inList: 'Đã lưu',
    },
    sections: {
      continueWatching: 'Tiếp tục xem',
      trendingNow: 'Thịnh hành trên House Drama',
      recommended: 'Dành cho bạn',
      newReleases: 'Mới phát hành',
      vipExclusives: 'Độc quyền VIP',
      animeDonghua: 'Hoạt hình & Donghua ngắn',
      dubbedSeries: 'Phim Lồng tiếng',
      netShortTrending: 'NetShort Thịnh hành',
      anyReelAsian: 'AnyReel Châu Á Nổi bật',
      meloloTrending: 'Melolo Bảng xếp hạng',
      viewAll: 'Xem tất cả',
      loadMore: 'Tải thêm',
      loading: 'Đang tải...',
      resumeEp: 'Xem tiếp Tập',
      removeHistory: 'Xóa khỏi lịch sử',
      backToHome: 'Về Trang chủ',
      backToBrowse: 'Quay lại',
      hotPicks: 'Tuyển chọn Hot & Mới',
      homeCatalogGrid: 'Danh mục Chính',
      exploreTitle: 'Khám phá Tất cả Danh mục',
      exploreSubtitle: 'Khám phá mọi nguồn phim, hoạt hình, lồng tiếng và phim mới phát hành.',
      exploreAllCategories: 'Khám phá Tất cả Danh mục',
      exploreMoreProviders: 'Tải thêm nguồn phim',
      pickedForYou: 'Đề xuất Dành riêng cho Bạn',
      becauseYouWatched: 'Vì bạn đã xem',
      dramaWatchlistTitle: 'Danh sách Phim bộ',
      dramaWatchlistSubtitle: 'Các bộ phim ngắn và series bạn đã lưu.',
      dramaWatchlistEmpty: 'Danh sách Phim bộ đang trống. Lưu bất kỳ phim bộ nào để xem sau.',
      exploreDramasBtn: 'Khám phá Phim bộ',
    },
    search: {
      title: 'Tìm kiếm Đa nguồn',
      placeholder: 'Tìm phim trên 49 nền tảng (DramaBox, NetShort, iQIYI, JoyReels...)...',
      recentSearches: 'Tìm kiếm gần đây',
      trendingSearches: 'Tìm kiếm thịnh hành',
      removeRecent: 'Xóa mục này',
      clearRecent: 'Xóa',
      searchingBoth: 'Đang tìm đồng thời trên toàn bộ 49 nguồn phim...',
      noResults: 'Không tìm thấy phim phù hợp',
      tryAnother: 'Thử từ khóa khác hoặc đổi ngôn ngữ.',
      resultsCount: 'kết quả từ các nguồn',
    },
    player: {
      episodes: 'Danh sách tập',
      nextReady: 'Tập tiếp đã sẵn sàng',
      autoNext: 'Tự chuyển tập',
      retry: 'Thử lại',
      streamUnavailable: 'Không thể tải video',
      loadingEp: 'Đang tải Tập',
      watched: 'Đã xem',
      swipeHint: 'Chạm màn hình để ẩn/hiện điều khiển · Chạm 2 lần ±10 giây',
      quality: 'Chất lượng',
      fullscreen: 'Toàn màn hình',
      exitFullscreen: 'Thoát toàn màn hình',
      subtitles: 'CC / Phụ đề',
      subtitleTracks: 'Ngôn ngữ phụ đề',
      subtitleOff: 'Tắt',
      noSubtitlesFound: 'Không phát hiện phụ đề trong luồng video này',
      subtitleStyleLabel: 'Kiểu hiển thị phụ đề',
      subtitleSize: 'Cỡ chữ',
      subtitleColor: 'Màu chữ',
      subtitleBg: 'Độ mờ nền',
      commentsTitle: 'Cảm xúc & Bình luận',
      commentPlaceholder: 'Viết bình luận về tập này...',
      postComment: 'Gửi',
      noComments: 'Chưa có bình luận nào. Hãy là người đầu tiên!',
      shareDrama: 'Chia sẻ',
      skipIntro: 'Bỏ qua Intro →',
      pip: 'PiP',
      like: 'Thích',
      liked: 'Đã thích',
      theaterMode: 'Chế độ Rạp',
      exitTheaterMode: 'Thoát Rạp',
      audioTrack: 'Âm thanh',
      offlineCached: 'Sẵn sàng Ngoại tuyến',
      nextEpisodeIn: 'Tập tiếp theo sau',
      rewind10s: 'Tua lùi 10s',
      forward10s: 'Tua tới 10s',
      zoomFill: 'Lấp đầy màn hình',
      zoomFit: 'Vừa màn hình',
      pinchHint: 'Phóng to để Toàn màn hình · Thu nhỏ để thoát',
      saveMovie: 'Lưu Phim',
      savedMovie: 'Đã lưu',
      saveDrama: 'Lưu Phim bộ',
      savedDrama: 'Đã lưu',
    },
    auth: {
      signInTitle: 'Đăng nhập với Google',
      signInWithGoogle: 'Đăng nhập Google để Thích & Bình luận',
      gateReasonDefault:
        'Kết nối tài khoản Google thật của bạn để thích phim, gửi bình luận và lưu chuỗi ngày xem.',
      gateLikeReason: 'Đăng nhập Google để Thích bộ phim này.',
      gateCommentReason: 'Đăng nhập Google để gửi bình luận & cảm xúc.',
      gateWatchlistReason: 'Đăng nhập Google để lưu phim và xem Danh sách Phim của bạn.',
      continueBtn: 'Đăng nhập với Google',
      signingIn: 'Đang kết nối Google...',
      authErrorPopupBlocked:
        'Cửa sổ đăng nhập Google bị chặn hoặc đóng. Nhấn nút bên dưới để thử lại.',
      profileTitle: 'Tài khoản của tôi',
      signedInAs: 'Tài khoản Google đã xác minh',
      likedCount: 'Phim đã thích',
      savedCount: 'Danh sách Phim',
      dramaWatchlistCount: 'Danh sách Phim bộ',
      openHelpCenter: 'Trung tâm Trợ giúp / FAQ',
      signOut: 'Đăng xuất',
    },
    watchlistStatus: {
      all: 'Tất cả',
      watching: 'Đang xem',
      plan: 'Dự định xem',
      completed: 'Hoàn thành',
      markCompleted: 'Đánh dấu đã xong',
      completedBadge: 'Hoàn thành',
    },
    engagement: {
      rateTitle: 'Đánh giá phim',
      yourRating: 'Đánh giá của bạn',
      tapToRate: 'Chạm sao để đánh giá',
      shareDrama: 'Chia sẻ phim',
      generateSpoilerCard: 'Tạo thẻ Spoiler / Chia sẻ',
      downloadSpoilerCard: 'Tải ảnh PNG 9:16',
      generatingCard: 'Đang tạo thẻ 9:16...',
      spoilerCardReady: 'Thẻ Spoiler 9:16 đã sẵn sàng',
      shareStoryTitle: 'Trình tạo thẻ Spoiler',
      copyCaptionLink: 'Sao chép Caption & Liên kết',
      shareWhatsapp: 'WhatsApp',
      shareTelegram: 'Telegram',
      shareX: 'Chia sẻ lên X',
      shareFacebook: 'Facebook',
      copyLink: 'Sao chép liên kết',
      linkCopied: 'Đã sao chép!',
      shareNative: 'Chia sẻ (IG / TikTok)',
      vipUnlockTitle: 'Tập VIP / Gay cấn đang khóa',
      vipUnlockDesc:
        'Tập 1–10 miễn phí! Chia sẻ phim này cho 1 nhóm hoặc bạn bè để mở khóa miễn phí.',
      shareToUnlockBtn: 'Chia sẻ cho 1 người để mở khóa miễn phí',
      unlockedBadge: 'Đã mở khóa',
      foldersTitle: 'Thư mục danh sách',
      createFolder: 'Tạo thư mục',
      folderPlaceholder: 'Tên thư mục mới...',
      saveToFolder: 'Thư mục',
      themeTitle: 'Màu chủ đề',
      contrastLabel: 'Độ tương phản',
      highContrast: 'Tương phản cao',
      standardContrast: 'Tiêu chuẩn',
    },
    exploreFilters: {
      allGenres: 'Tất cả thể loại',
      statusAll: 'Mọi trạng thái',
      statusOngoing: 'Đang ra',
      statusCompleted: 'Hoàn thành',
      sortPopular: 'Phổ biến nhất',
      sortRating: 'Đánh giá cao',
      sortNewest: 'Mới nhất',
      searchPlaceholder: 'Lọc theo tên phim hoặc từ khóa...',
      resetFilters: 'Đặt lại bộ lọc',
      matchingResults: 'phim phù hợp',
      noFilterMatches: 'Không tìm thấy phim nào khớp bộ lọc này.',
      browseFilteredTitle: 'Kết quả lọc danh mục',
    },
    dashboard: {
      title: 'Bảng điều khiển',
      subtitle: 'Quản lý hồ sơ, lịch sử xem đồng bộ đám mây, danh sách và bình luận.',
      tabProfile: 'Hồ sơ & Cài đặt',
      tabWatchlist: 'Danh sách xem',
      tabHistory: 'Lịch sử xem',
      tabComments: 'Bình luận của tôi',
      displayNameLabel: 'Tên hiển thị',
      bioLabel: 'Giới thiệu / Thể loại yêu thích',
      bioPlaceholder: 'Chia sẻ thể loại bạn yêu thích (VD: Tổng tài, Báo thù, Ngôn tình)...',
      languageLabel: 'Ngôn ngữ danh mục mặc định',
      preferencesLabel: 'Giao diện & Tùy chọn rạp',
      saveChanges: 'Lưu hồ sơ',
      savedSuccess: 'Đã lưu hồ sơ & tùy chọn!',
      signInRequiredTitle: 'Đồng bộ trên mọi thiết bị',
      signInRequiredDesc: 'Đăng nhập Google để quản lý hồ sơ, đồng bộ lịch sử xem và bình luận.',
      commentsEmpty: 'Bạn chưa đăng bình luận tập phim nào.',
      historyEmpty: 'Chưa có lịch sử xem. Hãy xem bất kỳ bộ phim nào để lưu tiến độ.',
      jumpToEp: 'Xem tiếp Tập',
      streakLabel: 'Chuỗi ngày xem',
      vipActive: 'VIP House Lover',
      statsWatchlist: 'Đã lưu',
      statsHistory: 'Đã xem',
      statsLiked: 'Đã thích',
      statsComments: 'Bình luận',
    },
    retention: {
      streakBadge: 'Chuỗi',
      vipCoffeeLover: 'VIP House Lover',
      streakRule:
        'Xem phim 3 ngày liên tiếp để mở khóa huy hiệu VIP House Lover trong bình luận.',
      streakProgress: 'ngày nữa để đạt huy hiệu VIP House Lover',
      upNextTitle: 'Phim tiếp theo',
      upNextPlayingIn: 'Phát Tập 1 sau',
      playNow: 'Phát ngay',
      cancel: 'Hủy',
      pushPromptTitle: 'Đừng bỏ lỡ tập mới',
      pushPromptDesc:
        'Nhận thông báo trình duyệt khi các bộ phim hot ra tập mới.',
      pushEnableBtn: 'Bật thông báo',
      pushLaterBtn: 'Để sau',
      pushEnabledToast: 'Đã bật thông báo tập mới!',
    },
    seoTags: {
      popularTagsTitle: 'Khám phá theo Thể loại',
      tagLandingSubtitle: 'Phim phù hợp với thẻ này trên toàn bộ 49 nguồn phim',
      clearTagFilter: 'Tất cả thể loại',
      genres: [
        'CEO',
        'Balas Dendam',
        'Kerajaan',
        'Sulih Suara',
        'Romance',
        'Billionaire',
        'Revenge',
        'Fantasy',
      ],
    },
    help: {
      title: 'Trung tâm Trợ giúp & FAQ',
      subtitle: 'Giải đáp nhanh về phát video, nguồn phim và tài khoản',
      faqs: [
        {
          q: 'Làm sao để chuyển giữa DramaBox và NetShort?',
          a: 'Nhấn nút Nguồn phim ở giữa thanh điều hướng dưới (hoặc bộ lọc bên dưới banner chính) để chọn Tất cả, DramaBox hoặc NetShort.',
        },
        {
          q: 'Tại sao cần đăng nhập Google để Thích và Bình luận?',
          a: 'Xem phim hoàn toàn miễn phí không cần đăng nhập. Đăng nhập Google giúp hiển thị tên/ảnh của bạn trên bình luận và lưu danh sách yêu thích.',
        },
        {
          q: 'Làm sao mở khóa tập VIP miễn phí?',
          a: 'Nhấn vào tập có biểu tượng khóa VIP và chọn "Chia sẻ cho 1 người để mở khóa miễn phí".',
        },
        {
          q: 'Nếu video không tải được hoặc giật lag thì sao?',
          a: 'Mở menu Chất lượng trong trình phát để đổi độ phân giải, hoặc nhấn Thử lại để kết nối lại tự động qua cổng máy chủ.',
        },
        {
          q: 'Làm sao cài đặt House Drama như ứng dụng điện thoại?',
          a: 'Trên Chrome Android nhấn "Cài đặt ngay". Trên iOS Safari nhấn Chia sẻ ↗ và chọn "Thêm vào Màn hình chính".',
        },
      ],
    },
    pwa: {
      installTitle: 'Install House Drama App',
      installDesc: 'Xem nhanh hơn, toàn màn hình & không thanh trình duyệt',
      installBenefits: 'Xem nhanh hơn, toàn màn hình & không thanh trình duyệt',
      installBtn: 'Cài đặt App',
      installNow: 'Cài đặt ngay',
      later: 'Để sau',
      iosBtn: 'Cài đặt App',
      iosGuideTitle: 'Cài đặt House Drama trên iOS',
      iosTooltip: "Nhấn nút Chia sẻ ↗ rồi chọn 'Thêm vào Màn hình chính'",
      iosStep1: '1. Nhấn nút Chia sẻ (Share) trên thanh công cụ Safari.',
      iosStep2: '2. Cuộn xuống và chọn "Thêm vào Màn hình chính".',
      close: 'Đã hiểu',
      offlineBanner: 'Chế độ Ngoại tuyến — Đang hiển thị thư viện đã lưu.',
      welcomeBadge: 'Chào mừng đến House Drama',
      perkFast: 'Tải Tức thì',
      perkFullscreen: 'Toàn Màn hình',
      perkOffline: 'Lưu Ngoại tuyến',
      browserInstallHint:
        'Mở menu trình duyệt (⋮ hoặc Chia sẻ) và chọn "Cài đặt ứng dụng" hoặc "Thêm vào Màn hình chính".',
    },
    footer: {
      tagline:
        'Rạp phim ngắn dọc & phim Trung Quốc đa nguồn cao cấp kết nối 49+ nền tảng.',
      onlineNow: 'Đang trực tuyến',
      todayVisitors: 'Khách hôm nay',
      totalVisitors: 'Tổng lượt khách',
      totalViews: 'Tổng lượt xem',
      linksTitle: 'Nền tảng & Pháp lý',
      about: 'Về chúng tôi',
      privacy: 'Chính sách bảo mật',
      terms: 'Điều khoản dịch vụ',
      dmca: 'Miễn trừ DMCA',
      contact: 'Liên hệ & Hợp tác',
      helpCenter: 'Trợ giúp / FAQ',
      rights: '© 2026 House Drama. Bảo lưu mọi quyền.',
    },
    legal: {
      about: {
        title: 'Về House Drama',
        subtitle: 'Rạp chiếu phim ngắn dọc đa nguồn cao cấp',
        paragraphs: [
          'House Drama tổng hợp các bộ phim ngắn dọc, ngôn tình tổng tài, báo thù và hoạt hình ngắn trong giao diện rạp chiếu tối sang trọng.',
          'Hệ thống đồng bộ trực tiếp danh mục từ DramaBox và NetShort với đa ngôn ngữ, phát HLS thích ứng và cài đặt PWA.',
        ],
      },
      privacy: {
        title: 'Chính sách bảo mật',
        subtitle: 'Lưu trữ cục bộ · Không theo dõi xâm lấn',
        paragraphs: [
          'House Drama lưu phiên Google, Danh sách xem, tiến trình Tiếp tục xem, đánh giá và tùy chọn ngôn ngữ ngay trong localStorage trình duyệt của bạn.',
          'Chúng tôi không bán dữ liệu xem phim cho bên thứ ba.',
        ],
      },
      terms: {
        title: 'Điều khoản dịch vụ',
        subtitle: 'Quy định sử dụng & Phát trực tuyến',
        paragraphs: [
          'House Drama hoạt động như giao diện khám phá và phát video kết nối tới các API nội dung phim ngắn được ủy quyền.',
          'Quyền truy cập các tập VIP tuân theo quy định của từng nhà cung cấp nguồn.',
        ],
      },
      dmca: {
        title: 'Miễn trừ DMCA / Bản quyền',
        subtitle: 'Tuân thủ bản quyền & Xử lý nội dung',
        paragraphs: [
          'House Drama không lưu trữ tệp video trên máy chủ riêng. Toàn bộ ảnh bìa, thông tin và luồng video được truyền trực tiếp từ DramaBox & NetShort.',
          'Chủ sở hữu bản quyền có thể liên hệ với chúng tôi kèm bằng chứng để được xử lý nhanh chóng.',
        ],
      },
      contact: {
        title: 'Liên hệ & Hợp tác',
        subtitle: 'Tích hợp nguồn phim, Kinh doanh & Hỗ trợ',
        paragraphs: [
          'Bạn muốn hợp tác tích hợp nguồn phim mới hoặc báo lỗi phát video? Hãy liên hệ trực tiếp với đội ngũ của chúng tôi bên dưới.',
        ],
      },
    },
    contactForm: {
      namePlaceholder: 'Tên của bạn hoặc Studio',
      emailPlaceholder: 'you@domain.com',
      messagePlaceholder: 'Nhập nội dung hợp tác hoặc góp ý...',
      send: 'Gửi tin nhắn',
      sentSuccess: 'Đã nhận tin nhắn! Đội ngũ sẽ phản hồi sớm.',
      telegramLabel: 'Telegram chính thức',
      emailLabel: 'Email chính thức',
    },
  },
};
