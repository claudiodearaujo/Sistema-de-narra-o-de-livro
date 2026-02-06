import { Injectable } from '@angular/core';

// Declare gtag function for TypeScript
declare let gtag: Function;

/**
 * Analytics Service
 * Manages Google Analytics 4 event tracking
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor() { }

  /**
   * Track a custom event
   * @param eventName Name of the event
   * @param eventParams Additional parameters for the event
   */
  trackEvent(eventName: string, eventParams: any = {}): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventParams);
    }
  }

  /**
   * Track page view
   * @param pageTitle Title of the page
   * @param pagePath Path of the page
   */
  trackPageView(pageTitle: string, pagePath: string): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', {
        page_title: pageTitle,
        page_path: pagePath
      });
    }
  }

  // ========================================
  // BOOK EVENTS
  // ========================================

  /**
   * Track when user views book details
   */
  trackBookView(bookId: string, bookTitle: string): void {
    this.trackEvent('view_book', {
      book_id: bookId,
      book_title: bookTitle,
      content_type: 'book'
    });
  }

  /**
   * Track when user creates a book
   */
  trackBookCreate(bookId: string, bookTitle: string): void {
    this.trackEvent('create_book', {
      book_id: bookId,
      book_title: bookTitle,
      content_type: 'book'
    });
  }

  /**
   * Track when user edits a book
   */
  trackBookEdit(bookId: string, bookTitle: string): void {
    this.trackEvent('edit_book', {
      book_id: bookId,
      book_title: bookTitle,
      content_type: 'book'
    });
  }

  /**
   * Track when user deletes a book
   */
  trackBookDelete(bookId: string, bookTitle: string): void {
    this.trackEvent('delete_book', {
      book_id: bookId,
      book_title: bookTitle,
      content_type: 'book'
    });
  }

  // ========================================
  // CHAPTER EVENTS
  // ========================================

  /**
   * Track when user creates a chapter
   */
  trackChapterCreate(bookId: string, chapterId: string, chapterTitle: string): void {
    this.trackEvent('create_chapter', {
      book_id: bookId,
      chapter_id: chapterId,
      chapter_title: chapterTitle,
      content_type: 'chapter'
    });
  }

  /**
   * Track when user views a chapter
   */
  trackChapterView(bookId: string, chapterId: string, chapterTitle: string): void {
    this.trackEvent('view_chapter', {
      book_id: bookId,
      chapter_id: chapterId,
      chapter_title: chapterTitle,
      content_type: 'chapter'
    });
  }

  /**
   * Track when user edits a chapter
   */
  trackChapterEdit(bookId: string, chapterId: string, chapterTitle: string): void {
    this.trackEvent('edit_chapter', {
      book_id: bookId,
      chapter_id: chapterId,
      chapter_title: chapterTitle,
      content_type: 'chapter'
    });
  }

  // ========================================
  // CHARACTER EVENTS
  // ========================================

  /**
   * Track when user creates a character
   */
  trackCharacterCreate(bookId: string, characterId: string, characterName: string): void {
    this.trackEvent('create_character', {
      book_id: bookId,
      character_id: characterId,
      character_name: characterName,
      content_type: 'character'
    });
  }

  /**
   * Track when user views characters list
   */
  trackCharactersView(bookId: string): void {
    this.trackEvent('view_characters', {
      book_id: bookId,
      content_type: 'character_list'
    });
  }

  // ========================================
  // SPEECH EVENTS
  // ========================================

  /**
   * Track when user creates a speech/narration
   */
  trackSpeechCreate(bookId: string, chapterId: string, characterId: string): void {
    this.trackEvent('create_speech', {
      book_id: bookId,
      chapter_id: chapterId,
      character_id: characterId,
      content_type: 'speech'
    });
  }

  /**
   * Track when user plays a speech/narration
   */
  trackSpeechPlay(speechId: string, bookId?: string): void {
    this.trackEvent('play_speech', {
      speech_id: speechId,
      book_id: bookId,
      content_type: 'speech'
    });
  }

  /**
   * Track when user generates TTS for a speech
   */
  trackTTSGenerate(speechId: string, voiceId: string): void {
    this.trackEvent('generate_tts', {
      speech_id: speechId,
      voice_id: voiceId,
      content_type: 'tts'
    });
  }

  // ========================================
  // NAVIGATION EVENTS
  // ========================================

  /**
   * Track when user navigates to a specific section
   */
  trackNavigation(from: string, to: string, action: string): void {
    this.trackEvent('navigation', {
      from_page: from,
      to_page: to,
      action: action
    });
  }

  /**
   * Track when user clicks on quick action button
   */
  trackQuickAction(actionName: string, bookId?: string): void {
    this.trackEvent('quick_action', {
      action_name: actionName,
      book_id: bookId
    });
  }

  /**
   * Track when user switches tabs
   */
  trackTabSwitch(tabName: string, context: string): void {
    this.trackEvent('tab_switch', {
      tab_name: tabName,
      context: context
    });
  }

  // ========================================
  // SOCIAL EVENTS
  // ========================================

  /**
   * Track when user shares content
   */
  trackShare(contentType: string, contentId: string, shareMethod: string): void {
    this.trackEvent('share', {
      content_type: contentType,
      content_id: contentId,
      method: shareMethod
    });
  }

  /**
   * Track when user likes content
   */
  trackLike(contentType: string, contentId: string): void {
    this.trackEvent('like', {
      content_type: contentType,
      content_id: contentId
    });
  }

  /**
   * Track when user comments on content
   */
  trackComment(contentType: string, contentId: string): void {
    this.trackEvent('comment', {
      content_type: contentType,
      content_id: contentId
    });
  }

  /**
   * Track when user follows another user
   */
  trackFollow(userId: string): void {
    this.trackEvent('follow', {
      target_user_id: userId
    });
  }

  // ========================================
  // USER EVENTS
  // ========================================

  /**
   * Track user login
   */
  trackLogin(method: string): void {
    this.trackEvent('login', {
      method: method
    });
  }

  /**
   * Track user signup
   */
  trackSignUp(method: string): void {
    this.trackEvent('sign_up', {
      method: method
    });
  }

  /**
   * Track user logout
   */
  trackLogout(): void {
    this.trackEvent('logout', {});
  }

  // ========================================
  // ENGAGEMENT EVENTS
  // ========================================

  /**
   * Track time spent on page
   */
  trackTimeOnPage(pageTitle: string, timeInSeconds: number): void {
    this.trackEvent('time_on_page', {
      page_title: pageTitle,
      duration_seconds: timeInSeconds
    });
  }

  /**
   * Track when user searches
   */
  trackSearch(searchTerm: string, resultsCount: number): void {
    this.trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount
    });
  }

  /**
   * Track error events
   */
  trackError(errorType: string, errorMessage: string, context?: string): void {
    this.trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      context: context
    });
  }

  // ========================================
  // PHASE 3: ADVANCED EVENTS
  // ========================================

  // --- SCROLL DEPTH TRACKING ---

  private scrollThresholds = [25, 50, 75, 90, 100];
  private trackedThresholds: Set<number> = new Set();

  /**
   * Track scroll depth on a page
   * @param percentage Current scroll percentage (0-100)
   * @param pagePath Current page path
   */
  trackScrollDepth(percentage: number, pagePath: string): void {
    for (const threshold of this.scrollThresholds) {
      if (percentage >= threshold && !this.trackedThresholds.has(threshold)) {
        this.trackedThresholds.add(threshold);
        this.trackEvent('scroll_depth', {
          percent_scrolled: threshold,
          page_path: pagePath
        });
      }
    }
  }

  /**
   * Reset scroll tracking (call on page change)
   */
  resetScrollTracking(): void {
    this.trackedThresholds.clear();
  }

  // --- FORM TRACKING ---

  /**
   * Track form start (first interaction)
   */
  trackFormStart(formName: string, formId?: string): void {
    this.trackEvent('form_start', {
      form_name: formName,
      form_id: formId
    });
  }

  /**
   * Track form submission
   */
  trackFormSubmit(formName: string, formId?: string, success: boolean = true): void {
    this.trackEvent('form_submit', {
      form_name: formName,
      form_id: formId,
      success: success
    });
  }

  /**
   * Track form abandonment
   */
  trackFormAbandon(formName: string, formId?: string, lastFieldInteracted?: string): void {
    this.trackEvent('form_abandon', {
      form_name: formName,
      form_id: formId,
      last_field: lastFieldInteracted
    });
  }

  /**
   * Track form field interaction
   */
  trackFormFieldFocus(formName: string, fieldName: string): void {
    this.trackEvent('form_field_focus', {
      form_name: formName,
      field_name: fieldName
    });
  }

  // --- CUSTOM USER DIMENSIONS ---

  /**
   * Set user properties/dimensions
   */
  setUserProperties(properties: { [key: string]: any }): void {
    if (typeof gtag !== 'undefined') {
      gtag('set', 'user_properties', properties);
    }
  }

  /**
   * Set user type dimension (free, premium, etc.)
   */
  setUserType(userType: 'free' | 'premium' | 'trial' | 'admin'): void {
    this.setUserProperties({ user_type: userType });
  }

  /**
   * Set user ID for cross-device tracking
   */
  setUserId(userId: string): void {
    if (typeof gtag !== 'undefined') {
      gtag('config', 'G-0VZYW339W8', { user_id: userId });
    }
  }

  /**
   * Set content creator status
   */
  setCreatorStatus(isCreator: boolean, booksCount: number = 0): void {
    this.setUserProperties({
      is_creator: isCreator,
      books_count: booksCount
    });
  }

  // --- CAMPAIGN/UTM TRACKING ---

  /**
   * Parse UTM parameters from URL and track campaign
   */
  trackCampaignFromUrl(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    const utmTerm = urlParams.get('utm_term');
    const utmContent = urlParams.get('utm_content');

    if (utmSource || utmMedium || utmCampaign) {
      this.trackEvent('campaign_hit', {
        campaign_source: utmSource,
        campaign_medium: utmMedium,
        campaign_name: utmCampaign,
        campaign_term: utmTerm,
        campaign_content: utmContent
      });

      // Store in session for attribution
      sessionStorage.setItem('utm_data', JSON.stringify({
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        term: utmTerm,
        content: utmContent
      }));
    }
  }

  /**
   * Get stored UTM data from session
   */
  getStoredUtmData(): { source?: string; medium?: string; campaign?: string; term?: string; content?: string } | null {
    const data = sessionStorage.getItem('utm_data');
    return data ? JSON.parse(data) : null;
  }

  /**
   * Track conversion with campaign attribution
   */
  trackConversionWithAttribution(conversionName: string, value?: number): void {
    const utmData = this.getStoredUtmData();
    this.trackEvent(conversionName, {
      value: value,
      campaign_source: utmData?.source,
      campaign_medium: utmData?.medium,
      campaign_name: utmData?.campaign
    });
  }

  // --- EXTERNAL LINK TRACKING ---

  /**
   * Track external link clicks
   */
  trackOutboundLink(url: string, linkText?: string): void {
    this.trackEvent('click', {
      link_url: url,
      link_text: linkText,
      outbound: true
    });
  }

  // --- FILE DOWNLOAD TRACKING ---

  /**
   * Track file downloads
   */
  trackFileDownload(fileName: string, fileType: string, fileSize?: number): void {
    this.trackEvent('file_download', {
      file_name: fileName,
      file_extension: fileType,
      file_size: fileSize
    });
  }

  // ========================================
  // PHASE 4: FUNNEL & CONVERSION TRACKING
  // ========================================

  // --- FUNNEL STEP TRACKING ---

  /**
   * Track funnel step progression
   * Use this to track user progression through multi-step processes
   */
  trackFunnelStep(funnelName: string, stepNumber: number, stepName: string, metadata?: Record<string, any>): void {
    this.trackEvent('funnel_step', {
      funnel_name: funnelName,
      step_number: stepNumber,
      step_name: stepName,
      ...metadata
    });
  }

  /**
   * Track funnel completion
   */
  trackFunnelComplete(funnelName: string, totalSteps: number, metadata?: Record<string, any>): void {
    this.trackEvent('funnel_complete', {
      funnel_name: funnelName,
      total_steps: totalSteps,
      ...metadata
    });
  }

  /**
   * Track funnel abandonment
   */
  trackFunnelAbandon(funnelName: string, lastStep: number, lastStepName: string): void {
    this.trackEvent('funnel_abandon', {
      funnel_name: funnelName,
      last_step: lastStep,
      last_step_name: lastStepName
    });
  }

  // --- PRE-DEFINED FUNNELS ---

  /**
   * User Registration Funnel
   */
  trackRegistrationFunnel(step: 'start' | 'email_entered' | 'password_entered' | 'profile_completed' | 'verified'): void {
    const steps: Record<string, number> = {
      start: 1,
      email_entered: 2,
      password_entered: 3,
      profile_completed: 4,
      verified: 5
    };

    this.trackFunnelStep('user_registration', steps[step], step);

    if (step === 'verified') {
      this.trackFunnelComplete('user_registration', 5);
    }
  }

  /**
   * Book Creation Funnel
   */
  trackBookCreationFunnel(step: 'start' | 'title_entered' | 'details_filled' | 'cover_uploaded' | 'published'): void {
    const steps: Record<string, number> = {
      start: 1,
      title_entered: 2,
      details_filled: 3,
      cover_uploaded: 4,
      published: 5
    };

    this.trackFunnelStep('book_creation', steps[step], step);

    if (step === 'published') {
      this.trackFunnelComplete('book_creation', 5);
    }
  }

  /**
   * Chapter Narration Funnel
   */
  trackNarrationFunnel(step: 'chapter_selected' | 'speeches_added' | 'characters_assigned' | 'tts_generated' | 'audio_reviewed', bookId?: string): void {
    const steps: Record<string, number> = {
      chapter_selected: 1,
      speeches_added: 2,
      characters_assigned: 3,
      tts_generated: 4,
      audio_reviewed: 5
    };

    this.trackFunnelStep('narration_creation', steps[step], step, { book_id: bookId });

    if (step === 'audio_reviewed') {
      this.trackFunnelComplete('narration_creation', 5, { book_id: bookId });
    }
  }

  // --- CONVERSION GOALS ---

  /**
   * Track primary conversion: First book created
   */
  trackFirstBookConversion(bookId: string): void {
    this.trackEvent('conversion_first_book', {
      book_id: bookId,
      conversion_type: 'primary'
    });
  }

  /**
   * Track secondary conversion: First narration generated
   */
  trackFirstNarrationConversion(bookId: string, chapterId: string): void {
    this.trackEvent('conversion_first_narration', {
      book_id: bookId,
      chapter_id: chapterId,
      conversion_type: 'secondary'
    });
  }

  /**
   * Track premium conversion (if applicable)
   */
  trackPremiumConversion(planType: string, value?: number): void {
    this.trackEvent('conversion_premium', {
      plan_type: planType,
      value: value,
      conversion_type: 'monetization'
    });
  }

  // --- RETENTION TRACKING ---

  /**
   * Track user return after X days
   */
  trackUserReturn(daysSinceLastVisit: number): void {
    this.trackEvent('user_return', {
      days_since_last_visit: daysSinceLastVisit
    });
  }

  /**
   * Track feature re-engagement
   */
  trackFeatureReengagement(featureName: string, usageCount: number): void {
    this.trackEvent('feature_reengagement', {
      feature_name: featureName,
      usage_count: usageCount
    });
  }
}
