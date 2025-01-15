import { Observable } from '@nativescript/core';
import { android as androidApp } from '@nativescript/core/application';

declare const android: any;
declare const java: any;

export class HelloWorldModel extends Observable {
    private _isTextVisible: boolean = true;
    private _isListening: boolean = false;
    private _statusMessage: string = '';
    private _displayText: string = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالرَّحْمَٰنِ الرَّحِيمِ\nمَالِكِ يَوْمِ الدِّينِ\nإِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\nاهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ\nصِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ\nغَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ';
    private _recognizedWords: string = '';
    private _speechRecognizer: any;
    private _originalWords: string[];
    private _lastRecognizedIndex: number = -1;

    constructor() {
        super();
        
        this.set('isTextVisible', this._isTextVisible);
        this.set('isListening', this._isListening);
        this.set('statusMessage', this._statusMessage);
        this.set('displayText', this._displayText);
        this.set('recognizedWords', this._recognizedWords);
        
        this._originalWords = this._displayText.split(/[\s\n]+/);
        this.initializeSpeechRecognition();
    }

    get isTextVisible(): boolean {
        return this._isTextVisible;
    }

    get isListening(): boolean {
        return this._isListening;
    }

    get statusMessage(): string {
        return this._statusMessage;
    }

    get displayText(): string {
        return this._displayText;
    }

    get recognizedWords(): string {
        return this._recognizedWords;
    }

    public toggleVisibility() {
        this._isTextVisible = !this._isTextVisible;
        this.notifyPropertyChange('isTextVisible', this._isTextVisible);
    }

    private initializeSpeechRecognition() {
        if (androidApp) {
            const context = androidApp.context;
            const permissions = android.Manifest.permission;
            const hasPermission = android.content.pm.PackageManager.PERMISSION_GRANTED;
            
            if (context.checkSelfPermission(permissions.RECORD_AUDIO) !== hasPermission) {
                const activity = androidApp.foregroundActivity;
                if (activity) {
                    activity.requestPermissions([permissions.RECORD_AUDIO], 1);
                }
                return;
            }
            
            this._speechRecognizer = android.speech.SpeechRecognizer.createSpeechRecognizer(context);
            
            const that = this;
            const recognitionListener = new android.speech.RecognitionListener({
                onResults(results: any) {
                    const matches = results.getStringArrayList(android.speech.SpeechRecognizer.RESULTS_RECOGNITION);
                    if (matches && matches.size() > 0) {
                        const recognizedText = matches.get(0);
                        console.log('Recognized text:', recognizedText);
                        that.processRecognizedText(recognizedText);
                    }
                    // Restart listening automatically
                    setTimeout(() => {
                        if (that._isListening) {
                            that.startAndroidSpeechRecognition();
                        }
                    }, 1000);
                },
                onError(error: number) {
                    console.log('Speech recognition error:', error);
                    let errorMessage = 'حدث خطأ. حاول مرة أخرى';
                    
                    switch (error) {
                        case android.speech.SpeechRecognizer.ERROR_NO_MATCH:
                            errorMessage = 'لم يتم التعرف على الكلام. حاول مرة أخرى';
                            // Restart listening automatically for NO_MATCH error
                            if (that._isListening) {
                                setTimeout(() => that.startAndroidSpeechRecognition(), 1000);
                                return;
                            }
                            break;
                        case android.speech.SpeechRecognizer.ERROR_NETWORK:
                            errorMessage = 'تحقق من اتصال الإنترنت';
                            break;
                        case android.speech.SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                            errorMessage = 'انتهت مهلة الاتصال بالشبكة';
                            break;
                        case android.speech.SpeechRecognizer.ERROR_AUDIO:
                            errorMessage = 'خطأ في تسجيل الصوت';
                            break;
                        case android.speech.SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                            errorMessage = 'لم يتم اكتشاف صوت';
                            if (that._isListening) {
                                setTimeout(() => that.startAndroidSpeechRecognition(), 1000);
                                return;
                            }
                            break;
                    }
                    
                    that._statusMessage = errorMessage;
                    that.notifyPropertyChange('statusMessage', that._statusMessage);
                    
                    if (!that._isListening) {
                        that._isListening = false;
                        that.notifyPropertyChange('isListening', that._isListening);
                    }
                },
                onReadyForSpeech(params: any) {
                    console.log('Ready for speech');
                    that._statusMessage = 'جاهز للاستماع...';
                    that.notifyPropertyChange('statusMessage', that._statusMessage);
                },
                onBeginningOfSpeech() {
                    console.log('Beginning of speech');
                    that._statusMessage = 'جارٍ الاستماع...';
                    that.notifyPropertyChange('statusMessage', that._statusMessage);
                },
                onRmsChanged(rmsdB: number) {},
                onBufferReceived(buffer: any) {},
                onEndOfSpeech() {
                    console.log('End of speech');
                },
                onPartialResults(partialResults: any) {
                    const matches = partialResults.getStringArrayList(android.speech.SpeechRecognizer.RESULTS_RECOGNITION);
                    if (matches && matches.size() > 0) {
                        const recognizedText = matches.get(0);
                        console.log('Partial results:', recognizedText);
                        that.processRecognizedText(recognizedText);
                    }
                },
                onEvent(eventType: number, params: any) {}
            });

            this._speechRecognizer.setRecognitionListener(recognitionListener);
        }
    }

    public startSpeechRecognition() {
        if (androidApp) {
            const context = androidApp.context;
            const permissions = android.Manifest.permission;
            const hasPermission = android.content.pm.PackageManager.PERMISSION_GRANTED;
            
            if (context.checkSelfPermission(permissions.RECORD_AUDIO) !== hasPermission) {
                this._statusMessage = 'يرجى منح إذن الميكروفون والمحاولة مرة أخرى';
                this.notifyPropertyChange('statusMessage', this._statusMessage);
                return;
            }
            
            this._isListening = !this._isListening;
            this.notifyPropertyChange('isListening', this._isListening);
            
            if (this._isListening) {
                this.startAndroidSpeechRecognition();
            } else {
                if (this._speechRecognizer) {
                    this._speechRecognizer.stopListening();
                }
                this._statusMessage = 'تم إيقاف الاستماع';
                this.notifyPropertyChange('statusMessage', this._statusMessage);
            }
        }
    }

    private startAndroidSpeechRecognition() {
        const intent = new android.content.Intent(android.speech.RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                       android.speech.RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE, 'ar');
        intent.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, 'ar');
        intent.putExtra(android.speech.RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, true);
        intent.putExtra(android.speech.RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(android.speech.RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 100);
        intent.putExtra(android.speech.RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1500);
        intent.putExtra(android.speech.RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1500);
        intent.putExtra(android.speech.RecognizerIntent.EXTRA_MAX_RESULTS, 1);

        this._statusMessage = 'جارٍ الاستماع...';
        this.notifyPropertyChange('statusMessage', this._statusMessage);

        try {
            this._speechRecognizer.startListening(intent);
        } catch (error) {
            console.error('Speech recognition error:', error);
            this._statusMessage = 'خطأ في بدء التعرف على الكلام';
            this.notifyPropertyChange('statusMessage', this._statusMessage);
        }
    }

    private processRecognizedText(recognizedText: string) {
        console.log('Processing recognized text:', recognizedText);
        const recognizedWords = recognizedText.split(/\s+/);
        let currentIndex = this._lastRecognizedIndex + 1;
        
        for (const recognizedWord of recognizedWords) {
            while (currentIndex < this._originalWords.length) {
                const normalizedRecognized = this.normalizeArabicText(recognizedWord);
                const normalizedOriginal = this.normalizeArabicText(this._originalWords[currentIndex]);
                
                console.log('Comparing:', normalizedRecognized, 'with:', normalizedOriginal);
                
                if (normalizedRecognized === normalizedOriginal) {
                    console.log('Match found at index:', currentIndex);
                    this._lastRecognizedIndex = currentIndex;
                    this._recognizedWords = this._originalWords.slice(0, currentIndex + 1).join(' ');
                    this.notifyPropertyChange('recognizedWords', this._recognizedWords);
                    
                    if (currentIndex === this._originalWords.length - 1) {
                        this._statusMessage = 'أحسنت! لقد أكملت السورة';
                        this._isListening = false;
                        this.notifyPropertyChange('isListening', this._isListening);
                    } else {
                        this._statusMessage = 'أحسنت، استمر...';
                    }
                    this.notifyPropertyChange('statusMessage', this._statusMessage);
                    break;
                }
                currentIndex++;
            }
        }
    }

    private normalizeArabicText(text: string): string {
        if (!text) return '';
        
        return text.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[أإآا]/g, 'ا') // Normalize alef
            .replace(/[ىئي]/g, 'ي') // Normalize yaa
            .replace(/ة/g, 'ه') // Normalize taa marbouta
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim()
            .toLowerCase();
    }
}