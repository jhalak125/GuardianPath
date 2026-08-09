import io
import base64
import json
from gtts import gTTS

# Conversational Natural Indian Hindi Dialogues
DIALOGUES = {
    "mom_0": "अरे बेटा, कहाँ पहुँची? मैं बालकनी से देख रही हूँ, मेन रोड पे पूरी लाइट जल रही है, तू कहाँ है अभी?",
    "mom_1": "सुनो, तेरे पापा और मैं मेन गेट पे ही खड़े हैं, तेरा ही इंतज़ार कर रहे हैं। सीधे मेन रोड से ही आना, किसी गली में मत मुड़ना!",
    "mom_2": "हाँ, फ़ोन स्पीकर पे ही चालू रख जब तक गेट के अंदर ना आ जाए। हम सामने सड़क पे देख रहे हैं तुझे।",
    
    "police_0": "हेलो! सिटी पुलिस कंट्रोल रूम 112। पीसीआर पेट्रोल वैन 4 आपको मेन रोड के पास जीपीएस पे लाइव ट्रैक कर रही है। आप मेन रोड पर ही रहिए।",
    "police_1": "हमारी पेट्रोलिंग गाड़ी बस 1 मिनट में जंक्शन पहुँच रही है। लाइट वाली सड़क पर ही चलिए, पुलिस टीम रास्ते में है।",
    "police_2": "हाँ, लाइन चालू रखिए। पूरे रास्ते पर सीसीटीवी कैमरे और पुलिस गश्त एक्टिव है।",
    
    "driver_0": "हाँ जी भैया! मैं सिल्वर स्विफ्ट डिजायर लेके मेन रोड के कॉर्नर पे खड़ा हूँ, हजार्ड पार्किंग लाइट ऑन करके।",
    "driver_1": "हाँ, मैं आपको फुटपाथ पे चलते हुए देख रहा हूँ। गाड़ी का दरवाजा अनलॉक कर दिया है, सीधे आ जाइये।",
    "driver_2": "इंजन चालू है मेरा, आप आराम से सीधे कार के पास आ जाइये, मैं यहीं खड़ा हूँ।",
    
    "brother_0": "अरे भाई, मैं 100 फ़ीट रोड के कॉर्नर पे स्कूटी स्टार्ट करके खड़ा हूँ, कहाँ है तू?",
    "brother_1": "तेरा लाइव लोकेशन देख रहा हूँ मैं ऐप पे, बस एक मिनट में पहुँच रहा हूँ तेरे पास।",
    "brother_2": "सुन, मेन रोड पे ही रुकना, किसी अंधेरी गली-वली में मत जाना, मैं अभी आ रहा हूँ!"
}

def generate_natural_indian_audio():
    audio_map = {}
    for key, text in DIALOGUES.items():
        print(f"Generating natural Indian Hindi audio for {key}...")
        # Using tld='co.in' for authentic regional Indian prosody
        tts = gTTS(text=text, lang="hi", tld="co.in", slow=False)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        b64 = base64.b64encode(fp.getvalue()).decode('utf-8')
        audio_map[key] = f"data:audio/mp3;base64,{b64}"
    
    js_content = f"// Pre-rendered Authentic Conversational Indian Hindi Spoken Audio Clips (Base64 Encoded)\nexport const HINDI_AUDIO_CLIPS = {json.dumps(audio_map, indent=2)};\n"
    
    with open("/Users/jhalakverma/Desktop/GuardianPath/frontend/src/assets/hindi_audio_data.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    print("✓ Successfully generated natural conversational Indian Hindi audio in frontend/src/assets/hindi_audio_data.js!")

if __name__ == "__main__":
    generate_natural_indian_audio()
