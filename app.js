
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged  } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';
import { getDatabase, ref as dbRef, set, push, get } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

// Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB9OxGdh3dVrFDFHmyAWtt1WAASrPsf3CA",
  authDomain: "safelens.firebaseapp.com",
  databaseURL: "https://safelens-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "safelens",
  storageBucket: "safelens.appspot.com",
  messagingSenderId: "158160811936",
  appId: "1:158160811936:web:da72ab251d037e9f6356c5",
  measurementId: "G-C6K9TSX302"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);
let userEmail = '';
// Define your guideline version
const guidelineVersion = "1.0.0"; // Change this whenever you revise your guidelines



    // Function to handle login
    window.login = async function() {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            console.log('User signed in:', user);
            document.getElementById('login-link').classList.add('hidden'); // Hide login link
            document.getElementById('logout-link').classList.remove('hidden'); // Show logout link
            userEmail = user.email; // Capture user email
            // Additional user data handling can go here
            // After successful login, check if they wanted to proceed
            if (wantsToProceed) {
                register_user_acceptance(user);
                proceedToClassSelection();
                wantsToProceed = false; // Reset the flag
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    // Function to handle logout
    window.logout = async function() {
        try {
            await signOut(auth);
            console.log('User signed out');
            userEmail = '';
            document.getElementById('logout-link').classList.add('hidden'); // Hide logout link
            document.getElementById('login-link').classList.remove('hidden'); // Show login link
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

// Function to upload files to Firebase Storage
async function uploadFile(file, filePath) {
console.log("File type detected:", file.type);
    const storageRef = ref(storage, filePath);  // Create a reference to the file's path

    // Define the metadata with the correct content type
    const metadata = {
        contentType: file.type  // Set the content type based on the file's MIME type
    };

    // Upload the file with metadata to ensure the correct content type is stored
    const snapshot = await uploadBytes(storageRef, file, metadata);

    // Get the download URL for the uploaded file
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
}



   let selectedClass = ''; // Global variable to store the selected class
   let hasAcceptedLegalNotice = false;  // Track if the user has accepted the legal notice
   let firstSubmission = true; // Variable to track if this is the user's first submission
   let wantsToProceed = false;

   // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            console.log('User is signed in:', user);
            userEmail = user.email; // Capture user email
            document.getElementById('login-link').classList.add('hidden'); // Hide login link
            document.getElementById('logout-link').classList.remove('hidden'); // Show logout link
        } else {
            // No user is signed in
            console.log('No user is signed in');
            document.getElementById('logout-link').classList.add('hidden'); // Hide logout link
            document.getElementById('login-link').classList.remove('hidden'); // Show login link
        }
    });


   window.proceedToLegalGuidelines = function() {
    // Show the legal notice only the first time
    if (!hasAcceptedLegalNotice) {
        fadeOut('contribute-message', () => {
            document.getElementById('legal-notice').classList.remove('hidden');
            fadeIn('legal-notice');
        });
    } else {
         // Check if the user is logged in before proceeding
        const user = auth.currentUser; // Get the current user
        console.log("Regular coming", user)

        if (user) {
            proceedToClassSelection(); // Proceed to class selection
        } else {
            wantsToProceed = true; // Set the flag to true, indicating user wants to proceed
            login(); // Prompt user to log in
        }
    }
}

window.acceptLegalNotice = function() {
    hasAcceptedLegalNotice = true;  // Mark that the user has accepted the legal notice
    fadeOut('legal-notice', async() => {
        document.getElementById('legal-notice').classList.add('hidden');  // Hide the legal notice

        const user = auth.currentUser; // Check current user status
        console.log("First time coming", user)
        if (user) {
            register_user_acceptance(user)

            proceedToClassSelection(); // If logged in, proceed to class selection
        }

        else {
            wantsToProceed = true; // Set the flag for wanting to proceed
            login(); // Prompt user to log in
        }
});
}

window.register_user_acceptance = async function(user){

            const userId = user.uid; // Get the user ID
            const userEmail = user.email; // Get the user's email

            // Check if the user has already accepted the guidelines with the same version
            const dRef = dbRef(database, 'guidelines-accepted/' + userId);
            const snapshot = await get(dRef); // Get the existing record

            if (!snapshot.exists()) {
                // If no existing record, add a new entry
                const dataToSend = {
                    userId: userId,
                    userEmail: userEmail,
                    guidelineVersion: guidelineVersion
                };

                await set(dRef, dataToSend); // Write to the database
                console.log('Guidelines accepted data sent to database:', dataToSend);
            }

            else {
                // If record exists, check if the version is different
                const existingData = snapshot.val();
                if (existingData.guidelineVersion !== guidelineVersion) {
                    // If the version is different, update it
                    existingData.guidelineVersion = guidelineVersion;
                    await set(dRef, existingData); // Update the database
                    console.log('Guideline version updated for user:', userId);
                } else {
                    console.log('User has already accepted the current version of guidelines.');
                }
            }
}

window.declineLegalNotice = function() {
    // User declines the legal notice, return them to the contribute message
    fadeOut('legal-notice', () => {
        document.getElementById('legal-notice').classList.add('hidden');  // Hide the legal notice
        document.getElementById('contribute-message').classList.remove('hidden');
        fadeIn('contribute-message');
    });
}

window.proceedToClassSelection = function() {
    fadeOut('contribute-message', () => {
        document.getElementById('class-selection').classList.remove('hidden');
        fadeIn('class-selection');
    });
}
window.selectClass = function(className){
    selectedClass = className; // Store the selected class
    showModalitySelection(); // Proceed to the next step (modality selection)
}


window.showModalitySelection = function() {
    fadeOut('class-selection', () => {
        document.getElementById('modality-selection').classList.remove('hidden');
        fadeIn('modality-selection');
    });
}

window.showTextInput = function() {
    fadeOut('modality-selection', () => {
        document.getElementById('text-input').classList.remove('hidden');
        fadeIn('text-input');
        showSubmitButton(); // Show submit button for text input
    });
}

window.showImageInput = function() {
    fadeOut('modality-selection', () => {
        document.getElementById('image-upload').classList.remove('hidden');
        fadeIn('image-upload');
        showSubmitButton(); // Show submit button for image input
    });
}

window.showAudioInput = function() {
    fadeOut('modality-selection', () => {
        document.getElementById('audio-upload').classList.remove('hidden');
        fadeIn('audio-upload');
        showSubmitButton(); // Show submit button for audio input
    });
}

window.showSubmitButton = function() {
    document.getElementById('submit-button').classList.remove('hidden'); // Show the submit button
}

window.handleEnter = function(event) {
    if (event.key === 'Enter') {
        submitContent();
    }
}
window.generateCertificate = function() {
    const userName = document.getElementById('userName').value;

    if (!userName) {
        alert("Please enter your name.");
        return;
    }

    // Get the canvas element
    const canvas = document.getElementById('certificateCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1200;
    canvas.height = 800;

    // Add the SafeLens logo
    const logo = new Image();
    logo.src = 'SafeLens logo.png'; // Make sure this path is correct
    logo.onload = function() {
        // Proceed with drawing only after the logo is loaded

        // Draw the certificate background (black)
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add golden border
        ctx.strokeStyle = "#c3cc12"; // Gold color
        ctx.lineWidth = 10;
        ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

        // Add certificate title
        ctx.font = 'bold 50px serif'; // Similar to the image
        ctx.fillStyle = '#FFD700'; // Gold color for text
        ctx.textAlign = 'center';
        ctx.fillText('CERTIFICATE', canvas.width / 2, 150);
        ctx.font = 'bold 30px serif';
        ctx.fillText('OF APPRECIATION', canvas.width / 2, 200);

        // Add the user's name in a script-like font
        ctx.font = 'italic bold 40px cursive'; // Elegant font style for the name
        ctx.fillStyle = '#FFFFFF'; // White color for the name
        ctx.fillText(userName, canvas.width / 2, 350);

        // Add a message
        ctx.font = 'bold 25px serif';
        ctx.fillStyle = '#FFFFFF'; // White color for text
        ctx.fillText('in recognition of your invaluable contributions to data curation for SafeLens.', canvas.width / 2, 400);
        ctx.fillText('Your efforts have been instrumental in building a system for Guarding Digital Content', canvas.width / 2, 450);
        ctx.fillText('and ensuring safe online content for all.', canvas.width / 2, 480);

        // Draw the SafeLens logo
        ctx.drawImage(logo, (canvas.width / 2) - 150, 540, 300, 120); // Adjust the size and position as needed

        // Add the founder's name just below the logo
        ctx.font = 'italic 20px serif'; // Subtle font
        ctx.fillStyle = '#FFFFFF'; // White color
        ctx.textAlign = 'center';
        ctx.fillText('Founded by Nitish Bhardwaj', canvas.width / 2, 690);

        // Show the download link
        const dataURL = canvas.toDataURL('image/png');
        const downloadLink = document.getElementById('downloadCertificateLink');
        downloadLink.href = dataURL;
        downloadLink.classList.remove('hidden');
        downloadLink.innerText = 'Download Certificate';

        // Show "Back to Home" button
        document.getElementById('backHomeButton').classList.remove('hidden');
    };

    logo.onerror = function() {
        alert("Error: Logo could not be loaded. Please check the path.");
    };
};

window.submitContent = async function() {
    const thankYouMessage = document.getElementById('thank-you-message');
    const textContent = document.getElementById('textContent').value;
    const imageUpload = document.getElementById('imageUpload').files;
    const audioUpload = document.getElementById('audioUpload').files;
    const errorMessage = document.getElementById('error-message');

    // Clear previous error message
    errorMessage.style.opacity = 0;

    // Check for empty inputs based on modality
    if ((textContent === "" && !document.getElementById('text-input').classList.contains('hidden'))) {
        errorMessage.innerText = "Your input is empty, please write something.";
        fadeIn('error-message');
        return; // Stay on the current state
    }
    if ((imageUpload.length === 0 && !document.getElementById('image-upload').classList.contains('hidden'))) {
        errorMessage.innerText = "Your input is empty, please upload an image.";
        fadeIn('error-message');
        return; // Stay on the current state
    }
    if ((audioUpload.length === 0 && !document.getElementById('audio-upload').classList.contains('hidden'))) {
        errorMessage.innerText = "Your input is empty, please upload an audio file.";
        fadeIn('error-message');
        return; // Stay on the current state
    }

    // Validate file types for images and audio
    const imageFile = document.getElementById('imageUpload').files[0];
    const audioFile = document.getElementById('audioUpload').files[0];
    const supportedImageFormats = ['image/jpeg', 'image/png', 'image/gif'];
    const supportedAudioFormats = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

    if (imageFile && !supportedImageFormats.includes(imageFile.type)) {
        errorMessage.innerText = "Unsupported format. Please upload a valid image.";
        fadeIn('error-message');
        return;
    }
    if (audioFile && !supportedAudioFormats.includes(audioFile.type)) {
        errorMessage.innerText = "Unsupported format. Please upload a valid audio file.";
        fadeIn('error-message');
        return;
    }


        const dataRef = dbRef(database, 'user-contributions');
        const newEntryRef = push(dataRef);

        try {
            if (textContent !== "") {
                await set(newEntryRef, {
                    userEmail: userEmail,
                    contentType: 'text',
                    content: textContent,
                    class: selectedClass
                });
            }

            if (imageUpload.length > 0) {
                const imageFile = imageUpload[0];
                const imagePath = `images/${imageFile.name}`;
                const imageURL = await uploadFile(imageFile, imagePath);
                await set(newEntryRef, {
                    userEmail: userEmail,
                    contentType: 'image',
                    content: imageURL,
                    class: selectedClass
                });
            }

            if (audioUpload.length > 0) {
                const audioFile = audioUpload[0];
                const audioPath = `audio/${audioFile.name}`;
                const audioURL = await uploadFile(audioFile, audioPath);
                await set(newEntryRef, {
                    userEmail: userEmail,
                    contentType: 'audio',
                    content: audioURL,
                    class: selectedClass
                });
            }

            thankYouMessage.innerText = "Thank you for your contribution!";
            thankYouMessage.classList.remove('hidden');
            fadeIn('thank-you-message'); // Use fadeIn function to show thank-you message
            hideInputFields();
          if (firstSubmission) {
                    setTimeout(showCertificateModal, 2000); // Show the certificate modal after first submission
                    firstSubmission = false; // Reset the first submission flag
                } else {
                    setTimeout(resetToContribution, 2000); // Reset for next contribution
                }

        } catch (error) {
            console.error('Error uploading files or writing to Firebase:', error);
            errorMessage.innerText = "An error occurred while submitting your contribution.";
            fadeIn('error-message');
        }
    }

    window.showCertificateModal = function() {
    document.getElementById('certificate-modal').classList.remove('hidden');
    fadeIn('certificate-modal');
}

window.skipCertificate = function() {
    // Hide the certificate modal
    document.getElementById('certificate-modal').classList.add('hidden');

    // Show the initial contribution message state
    returnToInitialState(); // Call the function to reset to the initial state
}

window.returnToInitialState = function() {
    // Hide certificate modal
    document.getElementById('certificate-modal').classList.add('hidden');

    // Reset certificate modal inputs and hide download link and button
    document.getElementById('userName').value = '';
    document.getElementById('downloadCertificateLink').classList.add('hidden');
    document.getElementById('backHomeButton').classList.add('hidden');

    // Show the initial contribution state
    resetToContribution();
}
window.hideInputFields = function() {
    document.getElementById('text-input').classList.add('hidden');
    document.getElementById('image-upload').classList.add('hidden');
    document.getElementById('audio-upload').classList.add('hidden');
    document.getElementById('submit-button').classList.add('hidden'); // Hide submit button after submission
}

window.resetToContribution = function() {
    document.getElementById('contribute-message').classList.remove('hidden');
    fadeIn('contribute-message');
    // Reset input fields
    document.getElementById('textContent').value = '';
    document.getElementById('imageUpload').value = ''; // Clear image input
    document.getElementById('audioUpload').value = ''; // Clear audio input
    document.getElementById('error-message').style.opacity = 0; // Hide error message
    document.getElementById('thank-you-message').classList.add('hidden'); // Hide thank-you message
    // Show the initial contribution message
    document.getElementById('contribute-message').classList.remove('hidden');


}


window.fadeIn = function(elementId) {
    const element = document.getElementById(elementId);
    element.classList.remove('fade-out');
    element.classList.add('fade-in');
    element.style.opacity = 1; // Make it visible
}

window.fadeOut = function(elementId, callback) {
    const element = document.getElementById(elementId);
    element.classList.remove('fade-in');
    element.classList.add('fade-out');
    element.style.opacity = 0; // Fade out

    setTimeout(() => {
        callback();
    }, 500); // Wait for fade-out duration
}