import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// We use aes-256-ctr with a consistent secret key, stringArray obfuscation will hide this key
const ALGORITHM = 'aes-256-ctr';
const SECRET_KEY = crypto.createHash('sha256').update('StorePilot_Super_Secret_Trial_Key_2026').digest();

export function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(Buffer.from(text, 'utf8')), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(hash) {
    try {
        const parts = hash.split(':');
        const iv = Buffer.from(parts.shift(), 'hex');
        const encryptedText = Buffer.from(parts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
        const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
        return decrypted.toString('utf8');
    } catch (e) {
        return null;
    }
}

export function getConfigPath(app) {
    return path.join(app.getPath('userData'), 'system.config.json');
}

export function verifyLicenseKey(machineId, key) {
    const trimmedKey = key.trim();
    const trial7Key = Buffer.from(`${machineId}-StorePilot-Trial-7D-2026`).toString('base64');
    const trial14Key = Buffer.from(`${machineId}-StorePilot-Trial-14D-2026`).toString('base64');
    const fullKey = Buffer.from(`${machineId}-StorePilot-Full-Life-2026`).toString('base64');
    
    if (trimmedKey === fullKey) return 'FULL';
    if (trimmedKey === trial7Key) return 'TRIAL_7';
    if (trimmedKey === trial14Key) return 'TRIAL_14';
    return 'INVALID';
}

export function saveTrialState(app, state) {
    const configPath = getConfigPath(app);
    const dataString = JSON.stringify(state);
    const encryptedData = encrypt(dataString);
    fs.writeFileSync(configPath, encryptedData, 'utf8');
}

export function initTrialState(app) {
    const configPath = getConfigPath(app);
    const currentTime = Date.now();
    
    let state = null;
    let isTrialExpired = false;
    let isTampered = false;

    if (fs.existsSync(configPath)) {
        try {
            const encryptedData = fs.readFileSync(configPath, 'utf8');
            const decryptedData = decrypt(encryptedData);
            if (decryptedData) state = JSON.parse(decryptedData);
        } catch (e) {
            console.error("Failed to read trial config");
        }
    }

    if (!state) {
        state = {
            lastSeenTime: currentTime,
            activated: false,
            trialActivated: false,
            trialStartDate: null,
            trialDuration: 7 * 24 * 60 * 60 * 1000 // Default fallback
        };
        saveTrialState(app, state);
    }

    // Migrate old state if present
    if (state.startDate !== undefined && state.trialStartDate === undefined) {
        state.trialStartDate = state.startDate;
    }

    if (state.activated) {
        isTrialExpired = false;
    } else if (state.trialActivated) {
        if (currentTime < state.lastSeenTime) {
            console.error("Time Manipulation Detected!");
            isTampered = true;
            isTrialExpired = true;
        } else {
            const duration = state.trialDuration || (7 * 24 * 60 * 60 * 1000);
            if (currentTime - state.trialStartDate > duration) {
                isTrialExpired = true;
            } else {
                isTrialExpired = false;
            }
        }
    } else {
        isTrialExpired = false;
    }
    
    return { isTrialExpired, isTampered, isActivated: state.activated, isTrialActivated: state.trialActivated };
}

export function updateLastSeenTime(app, isTampered) {
    if (isTampered) return;

    const configPath = getConfigPath(app);
    let state = null;
    if (fs.existsSync(configPath)) {
        try {
            const encryptedData = fs.readFileSync(configPath, 'utf8');
            const decryptedData = decrypt(encryptedData);
            if (decryptedData) state = JSON.parse(decryptedData);
        } catch (e) {}
    }

    if (state && !state.activated) {
        const currentTime = Date.now();
        if (currentTime >= state.lastSeenTime) {
            state.lastSeenTime = currentTime;
            saveTrialState(app, state);
        }
    }
}
