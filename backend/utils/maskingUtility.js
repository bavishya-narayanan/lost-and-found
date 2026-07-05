const Match = require('../models/Match');
const RecoverySession = require('../models/RecoverySession');

/**
 * Deterministically checks if a user is the Admin, Owner, or Finder for a given item.
 */
const isUserAuthorized = async (item, user, itemType) => {
  if (!user) return false;
  
  const userIdStr = user._id.toString();

  // 1. Admin check
  if (user.role === 'admin' || user.email === 'admin@campus.com') {
    return true;
  }
  
  // 2. Owner/Finder direct check (the person who reported this item)
  if (item.reportedBy && item.reportedBy.toString() === userIdStr) {
    return true;
  }

  // 3. Counterpart check (Is this user the owner/finder of the matching counterpart item?)
  try {
    const query = itemType === 'lost' 
      ? { lostItem: item._id }
      : { foundItem: item._id };
      
    // Check matches
    const matches = await Match.find(query).populate('lostItem foundItem');
    for (const match of matches) {
      const otherItem = itemType === 'lost' ? match.foundItem : match.lostItem;
      if (otherItem && otherItem.reportedBy && otherItem.reportedBy.toString() === userIdStr) {
        return true;
      }
    }

    // Check recovery sessions
    const sessions = await RecoverySession.find({
      $or: [
        { owner: user._id },
        { finder: user._id }
      ]
    });
    for (const session of sessions) {
      const match = await Match.findById(session.matchId);
      if (match && (match.lostItem.toString() === item._id.toString() || match.foundItem.toString() === item._id.toString())) {
        return true;
      }
    }
  } catch (err) {
    console.error('Error in isUserAuthorized check:', err);
  }

  return false;
};

/**
 * Replace sensitive substring with a masked version in a string.
 */
const maskSubstrings = (text, value, type) => {
  if (!text || !value) return text;
  
  const valStr = value.toString().trim();
  if (valStr.length < 2) return text;

  const escaped = valStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  
  let maskedVal = '***';
  if (type === 'rollNumber') {
    maskedVal = valStr.slice(0, 4) + '*'.repeat(Math.max(0, valStr.length - 4));
  } else if (type === 'cardNumber') {
    maskedVal = '**** **** **** ' + valStr.slice(-4);
  } else if (type === 'aadhaarNumber') {
    maskedVal = 'xxxx xxxx ' + valStr.slice(-4);
  } else if (type === 'name' && valStr.length > 2) {
    maskedVal = valStr.split(' ').map(word => {
        if (word.length <= 1) return word;
        return word.charAt(0) + '*'.repeat(word.length - 1);
    }).join(' ');
  }
  
  return text.replace(regex, maskedVal);
};

/**
 * Apply general Regex masking for pattern-based protection as a secondary layer.
 */
const maskRegexPatterns = (text) => {
  if (!text) return text;
  let masked = text;
  
  // Aadhaar Number (12 digits)
  masked = masked.replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, 'xxxx xxxx ****');
  
  // Card Number (16 digits)
  masked = masked.replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '**** **** **** ****');
  
  // Phone Number (10 digits)
  masked = masked.replace(/\b\d{10}\b/g, '******xxxx');

  return masked;
};

/**
 * Mask an item dynamically before sending it to unauthorized users.
 */
const maskItem = async (item, user, itemType) => {
  if (!item) return item;
  
  const itemObj = typeof item.toObject === 'function' ? item.toObject() : { ...item };
  
  // Check auth
  const authorized = await isUserAuthorized(itemObj, user, itemType);
  if (authorized) {
    return itemObj;
  }

  // Strip exact coordinates for unauthorized users
  if (itemObj.location) {
    itemObj.location.latitude = undefined;
    itemObj.location.longitude = undefined;
  }
  if (itemObj.meetingLocation) {
    itemObj.meetingLocation.latitude = undefined;
    itemObj.meetingLocation.longitude = undefined;
  }

  // If not sensitive, no further masking required
  if (!itemObj.isSensitive) {
    return itemObj;
  }



  // Mask Title, Description, and OCR text
  let title = itemObj.title || '';
  let description = itemObj.description || '';
  let ocrText = itemObj.ocrText || '';

  const entities = itemObj.detectedEntities || {};
  
  // Mask using exact detected entity values
  if (entities.name) {
    title = maskSubstrings(title, entities.name, 'name');
    description = maskSubstrings(description, entities.name, 'name');
    ocrText = maskSubstrings(ocrText, entities.name, 'name');
  }
  if (entities.rollNumber) {
    title = maskSubstrings(title, entities.rollNumber, 'rollNumber');
    description = maskSubstrings(description, entities.rollNumber, 'rollNumber');
    ocrText = maskSubstrings(ocrText, entities.rollNumber, 'rollNumber');
  }
  if (entities.cardNumber) {
    title = maskSubstrings(title, entities.cardNumber, 'cardNumber');
    description = maskSubstrings(description, entities.cardNumber, 'cardNumber');
    ocrText = maskSubstrings(ocrText, entities.cardNumber, 'cardNumber');
  }
  if (entities.aadhaarNumber) {
    title = maskSubstrings(title, entities.aadhaarNumber, 'aadhaarNumber');
    description = maskSubstrings(description, entities.aadhaarNumber, 'aadhaarNumber');
    ocrText = maskSubstrings(ocrText, entities.aadhaarNumber, 'aadhaarNumber');
  }
  if (entities.bankName) {
    title = maskSubstrings(title, entities.bankName, 'bank');
    description = maskSubstrings(description, entities.bankName, 'bank');
    ocrText = maskSubstrings(ocrText, entities.bankName, 'bank');
  }

  // Apply fallback regex patterns
  itemObj.title = maskRegexPatterns(title);
  itemObj.description = maskRegexPatterns(description);
  itemObj.ocrText = maskRegexPatterns(ocrText);
  
  // Hide image if it is sensitive (unauthorized users should see a blurred placeholder)
  if (itemObj.image) {
    itemObj.image = '/uploads/blurred-placeholder.png'; // Handled via static placeholder
  }

  // Clear detected entities object for unauthorized viewers
  itemObj.detectedEntities = {};
  
  return itemObj;
};

module.exports = {
  isUserAuthorized,
  maskItem
};
