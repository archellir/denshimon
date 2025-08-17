/**
 * Copies text to clipboard and returns a promise
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

/**
 * Creates a temporary notification message handler
 */
export const createNotificationHandler = (
  setMessage: (message: string | null) => void,
  duration: number = 2000
) => {
  return (message: string) => {
    setMessage(message);
    setTimeout(() => setMessage(null), duration);
  };
};

/**
 * Handles copy to clipboard with notification feedback
 */
export const copyWithNotification = async (
  text: string,
  showNotification: (message: string) => void,
  successMessage: string = 'Copied to clipboard!',
  errorMessage: string = 'Failed to copy to clipboard'
): Promise<void> => {
  try {
    await copyToClipboard(text);
    showNotification(successMessage);
  } catch (error) {
    // Copy failed
    showNotification(errorMessage);
  }
};