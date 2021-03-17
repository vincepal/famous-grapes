window.user = null;

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];


document.addEventListener("DOMContentLoaded", function() {
  const promoWrapper = document.querySelector(".promo-wrapper");

  firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
      window.user = null;
      promoWrapper.style.display = "flex";
    } else {
      window.user = user;
      promoWrapper.style.display = "none";
    }
    
    updatePageForHash();
  });
});

window.addEventListener("hashchange", function() {
  updatePageForHash();
});

const updatePageForHash = () => {
  const {
    location: { pathname }
  } = window;

  const location = pathname.startsWith("/") ? pathname.substring(1) : pathname;

  const [key, param] = location.split("/");

  const linkLogout = document.getElementById("linkLogout");

  if (linkLogout) {
    linkLogout.addEventListener("click", () => {
      firebase
        .auth()
        .signOut()
        .then(() => window.location.replace("/"));
    });
  }

  switch (key) {
    case "dashboard-profile":
      if (!window.user) {
        window.location.replace("/sign-in");
      }

      const headingProfile = document.querySelector(".heading-2");      

      if (headingProfile) {
        headingProfile.innerText = `Welcome back, ${window.user.displayName}`;
        headingProfile.style.display = "flex";
      }

      const profileRef = firebase
        .firestore()
        .collection("users")
        .doc(firebase.auth().currentUser.email);
      profileRef
        .get()
        .then(orderSnapshot => {
          if (orderSnapshot.exists) {
            const { dob } = orderSnapshot.data();
          }
        })
        .catch(error => {
          console.error(error);
        });

      const deleteButton = document.querySelector(".delete-account .w-button");

      deleteButton.addEventListener("click", () => {
        const isSure = confirm("Are you sure you want to delete your account?");

        if (isSure) {
        firebase
          .auth()
          .currentUser.delete()
          .then(() => {
            window.location.replace("/");
          })
          .catch(error => {
            console.error(errr);
          });          
        }
      });

      break;
    case "dashboard-orders":
      if (!window.user) {
        window.location.replace("/sign-in");
      }

      const headingOrders = document.querySelector(".heading-2");

      if (headingOrders) {
        headingOrders.innerText = `Welcome back, ${window.user.displayName}`;
        headingOrders.style.display = "flex";
      }
      const orderWrap = document.getElementById("order-wrap");
      const orderTemplate = orderWrap.cloneNode();
      const orderTemplateTop = orderWrap
        .querySelector(".top-section")
        .cloneNode(true);
      const orderItemTemplate = orderWrap
        .querySelector(".product-item")
        .cloneNode(true);
      orderWrap.remove();

      const orderContainer = document.getElementById("right-container");

      const ordersRef = firebase
        .firestore()
        .collection("users")
        .doc(firebase.auth().currentUser.email)
        .collection("orders");
      ordersRef
        .get()
        .then(orderSnapshot => {
          if (!orderSnapshot.docs.length) {
            const message = document.createElement("span");
            message.innerText = "No history of orders.";
            orderContainer.appendChild(message);
          }
          orderSnapshot.docs.forEach(doc => {
            const { items, total, orderedAt } = doc.data();

            orderContainer.appendChild(orderTemplate.cloneNode(true));

            const orderWrap = orderContainer.querySelector(".order-wrap");          

            let orderedAtParsed;
            if (typeof orderedAt.toDate !== 'undefined') {
              orderedAtParsed = orderedAt.toDate();
            } else {
              orderedAtParsed = new Date(orderedAt);
            }
            
            const orderTop = orderTemplateTop.cloneNode(true);
            
            orderTop.querySelector(".date").innerText = `${orderedAtParsed.getUTCDate()}/${orderedAtParsed.getUTCMonth() + 1}/${orderedAtParsed.getFullYear()}`
            orderTop.querySelectorAll(".date")[1].innerText = total;

            orderWrap.appendChild(orderTop);
            

            items.forEach(item => {
              const orderItem = orderItemTemplate.cloneNode(true);
              orderItem.querySelector(".button.full.w-button").href = `/product/${item.slug}`
              orderItem.querySelector(".review.w-button").addEventListener("click", () => handleItemReviewClick(item.slug))
              
              orderItem.querySelector(".product-name").innerText = item.name;
              orderItem.querySelector(".product-price-text.smaller").innerText = `$ ${item.price}`;
              orderItem.querySelector(".quantity.tiny-left-margin").innerText = item.quantity;
              
              orderWrap.appendChild(orderItem);
            });
            
            orderWrap.style.display = "block";
          });
        })
        .catch(error => {
          console.error(error);
        });
      
      const reviewModal = document.getElementById("review-modal");
      
      reviewModal.style.display = "none";
      reviewModal.style.opacity = "0";      
      
      reviewModal.querySelector(".close-modal").addEventListener("click", handleModalClose);
      
      const ratingWrap = reviewModal.querySelector(".overall-rating-wrap");
      const STAR_FULL = ratingWrap.querySelector(".full").cloneNode(true);
      const STAR_EMPTY = ratingWrap.querySelector(".empty").cloneNode(true);
      
  
      while(ratingWrap.firstChild) {
        ratingWrap.removeChild(ratingWrap.firstChild);
      }
      
      const STAR_RATING_1 = STAR_EMPTY.cloneNode(true);
      const STAR_RATING_2 = STAR_EMPTY.cloneNode(true);
      const STAR_RATING_3 = STAR_EMPTY.cloneNode(true);
      const STAR_RATING_4 = STAR_EMPTY.cloneNode(true);
      const STAR_RATING_5 = STAR_EMPTY.cloneNode(true);
      
      
      STAR_RATING_1.addEventListener("click", () => handleRatingClicked(1));
      STAR_RATING_2.addEventListener("click", () => handleRatingClicked(2));
      STAR_RATING_3.addEventListener("click", () => handleRatingClicked(3));
      STAR_RATING_4.addEventListener("click", () => handleRatingClicked(4));
      STAR_RATING_5.addEventListener("click", () => handleRatingClicked(5));
      
      ratingWrap.appendChild(STAR_RATING_1);
      ratingWrap.appendChild(STAR_RATING_2);
      ratingWrap.appendChild(STAR_RATING_3);
      ratingWrap.appendChild(STAR_RATING_4);
      ratingWrap.appendChild(STAR_RATING_5);
      
      
      function makeAllEmpty() {
        STAR_RATING_1.classList.remove("full");
        STAR_RATING_1.classList.add("empty");    
        
        STAR_RATING_2.classList.remove("full");
        STAR_RATING_2.classList.add("empty");    
        
        STAR_RATING_3.classList.remove("full");
        STAR_RATING_3.classList.add("empty");        
        
        STAR_RATING_4.classList.remove("full");
        STAR_RATING_4.classList.add("empty");        
        
        STAR_RATING_5.classList.remove("full");
        STAR_RATING_5.classList.add("empty");    
      }
      
      function makeAllFull() {
        STAR_RATING_1.classList.remove("empty");
        STAR_RATING_1.classList.add("full");    
        
        STAR_RATING_2.classList.remove("empty");
        STAR_RATING_2.classList.add("full");    
        
        STAR_RATING_3.classList.remove("empty");
        STAR_RATING_3.classList.add("full");        
        
        STAR_RATING_4.classList.remove("empty");
        STAR_RATING_4.classList.add("full");        
        
        STAR_RATING_5.classList.remove("empty");
        STAR_RATING_5.classList.add("full");                
      }
      
      function handleRatingClicked(rating) {
        window.currentReviewRating = rating;
        
        switch(rating) {
          case 1:
            makeAllEmpty();
            STAR_RATING_1.classList.remove("empty");
            STAR_RATING_1.classList.add("full");
            break;
          case 2:
            makeAllEmpty();
            STAR_RATING_1.classList.remove("empty");
            STAR_RATING_1.classList.add("full");
            
            STAR_RATING_2.classList.remove("empty");
            STAR_RATING_2.classList.add("full");
            break;
          case 3:
            makeAllEmpty();
            STAR_RATING_1.classList.remove("empty");
            STAR_RATING_1.classList.add("full");
            
            STAR_RATING_2.classList.remove("empty");
            STAR_RATING_2.classList.add("full");
            
            STAR_RATING_3.classList.remove("empty");
            STAR_RATING_3.classList.add("full");
            break;
          case 4:
            makeAllEmpty();
            STAR_RATING_1.classList.remove("empty");
            STAR_RATING_1.classList.add("full");
            
            STAR_RATING_2.classList.remove("empty");
            STAR_RATING_2.classList.add("full");
            
            STAR_RATING_3.classList.remove("empty");
            STAR_RATING_3.classList.add("full");
                        
            STAR_RATING_4.classList.remove("empty");
            STAR_RATING_4.classList.add("full");
            break;
          case 5:
            STAR_RATING_1.classList.remove("empty");
            STAR_RATING_1.classList.add("full");
            
            STAR_RATING_2.classList.remove("empty");
            STAR_RATING_2.classList.add("full");
            
            STAR_RATING_3.classList.remove("empty");
            STAR_RATING_3.classList.add("full");
                        
            STAR_RATING_4.classList.remove("empty");
            STAR_RATING_4.classList.add("full");
                        
            STAR_RATING_5.classList.remove("empty");
            STAR_RATING_5.classList.add("full");            
            break;
        }
      }
      
      function handleModalClose() {
        reviewModal.style.display = "none";
        reviewModal.style.opacity = "0";      
      }
      
      function handleItemReviewClick(slug) {     
        window.currentProductReview = slug;
        
        
        // display modal
        reviewModal.style.display = "flex";
        reviewModal.style.opacity = "1";
        
        reviewModal.addEventListener("submit", handleReviewModalFormSubmit);
      }
      
      function handleReviewModalFormSubmit(e) {
        e.preventDefault();      
        e.stopPropagation();
        
        const title = reviewModal.querySelector("#review-title").value;
        const content = reviewModal.querySelector("#review-content").value;
        
        const collection = firebase.firestore().collection("products");
        const document = collection.doc(window.currentProductReview);
        const newReviewDocument = document.collection("reviews").doc();
        
        firebase.firestore().runTransaction((transaction) => {
          return transaction.get(document).then((doc) => {
            if (doc.exists) {              
              const data = doc.data();

              const newAverage =  (data.numReviews * data.avgRating + window.currentReviewRating) / (data.numReviews + 1);

              transaction.update(document, {
                numReviews: data.numReviews + 1,
                avgRating: newAverage
              });
            } else {            
              return transaction.set(document, {
                numReviews: 1,
                avgRating: window.currentReviewRating
              });

            }
              
            return transaction.set(newReviewDocument, {
              title, 
              content,
              createdAt: firebase.firestore.Timestamp.fromDate(
            new Date()
          ).toMillis(),
              rating: window.currentReviewRating
            });
          })
        })
        
        title.value = "";
        content.value = "";
        
        reviewModal.style.display = "none";
        reviewModal.style.opacity = "0";
      }
      break;
    //case "checkout":
    case "order-confirmation":
      const orderItems = [];
      const orderItemsEL = document.querySelectorAll(".order-item");

      const total = document
        .querySelector(".total-count-text")
        .innerText.replace("CA$", "")
        .trim();
      const subtotal = document
        .querySelector(".checkout-price")
        .innerText.replace("CA$", "")
        .trim();

      orderItemsEL.forEach(el => {
        const thumbnail = el.querySelector(".checkout-thumbnail").src;
        const productItem = el.querySelector(".cc-name-text-cart");

        const productSlug = productItem.href.split("/")[4];
        const productName = productItem.innerText;
        const productPrice = el
          .querySelector(".order-item-price")
          .innerText.replace("CA$", "")
          .trim();
        const productQuantity = el
          .querySelector(".checkout-quantity-wrap")
          .innerText.replace("Quantity:", "")
          .trim();

        orderItems.push({
          name: productName,
          slug: productSlug,
          thumbnail,
          price: productPrice,
          quantity: productQuantity
        });
      });

      if (window.user) {
        const orders = firebase
          .firestore()
          .collection("users")
          .doc(window.user.email)
          .collection("orders");

        orders.add({
          items: orderItems,
          total,
          subtotal,
          orderedAt: firebase.firestore.Timestamp.fromDate(
            new Date()
          ).toMillis()
        });
      }
      break;
    case "sign-up":
      const selectYear = document.getElementById("selectYear");
      const selectMonth = document.getElementById("selectMonth");
      const selectDay = document.getElementById("selectDay");

      const endYear = new Date().getFullYear() - 18;
      const startYear = new Date().getFullYear() - 100;

      for (let i = startYear; i < endYear; i++) {
        const option = document.createElement("option");
        option.text = i;
        option.value = i;
        selectYear.appendChild(option);
      }

      monthNames.forEach(function(m, i) {
        const option = document.createElement("option");
        option.text = m;
        option.value = i + 1;
        selectMonth.appendChild(option);
      });

      selectMonth.addEventListener("change", function(e) {
        if (selectYear.value != 0) {
          const days = new Date(selectYear.value, e.target.value, 0).getDate();

          for (let i = 1; i < days; i++) {
            const option = document.createElement("option");
            option.text = i;
            option.value = i;

            selectDay.appendChild(option);
          }
        }
      });

      const formSignup = document.getElementById("form-signup");
      formSignup.addEventListener("submit", handleSignup, true);

      function handleSignup() {
        event.preventDefault();
        event.stopPropagation();

        const firstName = document.getElementById("inputFirstName").value;
        const lastName = document.getElementById("inputLastName").value;
        const email = document.getElementById("inputEmail").value;
        const password = document.getElementById("inputPassword").value;

        firebase
          .auth()
          .createUserWithEmailAndPassword(email, password)
          .then(async () => {
            const currentUser = firebase.auth().currentUser;
            currentUser.updateProfile({
              displayName: `${firstName} ${lastName}`
            });

            await firebase
              .firestore()
              .collection("users")
              .doc(currentUser.uid)
              .set({
                dob: new Date(
                  selectYear.value,
                  selectMonth.value,
                  selectDay.value
                )
              });

            await currentUser.sendEmailVerification();
            formSignup.style.display = "none";

            const formDone = document.querySelector(".w-form-done");
            const formFail = document.querySelector(".w-form-fail");
            formDone.style.display = "flex";

            formFail.style.display = "none";

            window.location.replace("/dashboard");
          })
          .catch(error => {
            const formFail = document.querySelector(".w-form-fail");
            if (error.message) {
              formFail.querySelector(".error-message").innerText =
                error.message;
            }

            formFail.style.display = "flex";
          });
      }
      break;
    case "sign-in":
      const formSignin = document.getElementById("form-signin");
      formSignin.addEventListener("submit", handleSignin, true);

      function handleSignin(event) {
        event.preventDefault();
        event.stopPropagation();

        const email = document.getElementById("inputEmail").value;
        const password = document.getElementById("inputPassword").value;

        firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then(user => {
            formSignin.style.display = "none";
            window.location.replace("/dashboard");
          })
          .catch(error => {
            const formFail = document.querySelector(".w-form-fail");
            if (error.message) {
              formFail.innerText = error.message;
            }

            formFail.style.display = "flex";
          });
      }
      break;
    case "forgot-password":
      const formForgotPassword = document.getElementById(
        "form-forgot-password"
      );
      formForgotPassword.addEventListener("submit", handleForgotPassword, true);

      function handleForgotPassword(event) {
        event.preventDefault();
        event.stopPropagation();

        const email = document.getElementById("inputEmail").value;

        firebase
          .auth()
          .sendPasswordResetEmail(email)
          .then(() => {
            const formDone = document.querySelector(".w-form-done");
            const formFail = document.querySelector(".w-form-fail");
            formDone.style.display = "flex";
            formFail.style.display = "none";

            formForgotPassword.style.display = "none";
          })
          .catch(error => {
            const formFail = document.querySelector(".w-form-fail");

            if (error.message) {
              formFail.innerText = error.message;
            }

            formFail.style.display = "flex";
          });
      }
      break;
    case "product":
      const reviewsContainer = document.querySelector(".reviews-container");
      
      const starsWrap = reviewsContainer.querySelector(".stars-wrap").cloneNode(true);
      const reviewWrap = reviewsContainer.querySelector(".review-wrap").cloneNode(true);
      const seemore = reviewsContainer.querySelector(".w-button").cloneNode(true);
      
      
      while(reviewsContainer.firstChild) {
        reviewsContainer.removeChild(reviewsContainer.firstChild);
      }
      
      const productRef = firebase.firestore().collection("products").doc(param);         
      const reviewsRef = productRef.collection("reviews");

      productRef.get()
        .then((productRefSnap) => {
        
          if (productRefSnap.exists) {
            
            const { avgRating, numReviews } = productRefSnap.data();

            const top = starsWrap.cloneNode(true);
            top.querySelector(".review-big").innerText = avgRating;
            top.querySelector(".total-reviews").innerText = `${numReviews} reviews`;                 
            const FULL_STAR = top.querySelector(".icon.review-star").innerText;
            const EMPTY_STAR = top.querySelector(".icon.review-star.empty").innerText;

            const EMPTY_STARS = Math.floor(5 - avgRating);
            top.querySelector(".review-star").innerHTML = Array(avgRating).fill(FULL_STAR).join("") + Array(EMPTY_STARS).fill(EMPTY_STAR).join("");

            top.querySelector(".icon.review-star.empty").remove();
            reviewsContainer.appendChild(top);

            reviewsRef
              .get()
              .then(reviewSnapshot => {
                if (!reviewSnapshot.docs.length) {
                  const message = document.createElement("span");
                  message.innerText = "No reviews for this product.";
                  reviewsContainer.appendChild(message);
                }

              reviewSnapshot.docs.forEach(doc => {            
                const { title, content, rating, createdAt} = doc.data();
                const reviewItem = reviewWrap.cloneNode(true);
                reviewItem.querySelector(".review-title").innerText = title;
                reviewItem.querySelector(".review-comment").innerText = content;

                reviewItem.querySelector(".review-star.empty").remove();

                const EMPTY_STARS = Math.floor(5 - rating);
                reviewItem.querySelector(".review-star").innerHTML = Array(avgRating).fill(FULL_STAR).join("") + Array(EMPTY_STARS).fill(EMPTY_STAR).join("");
                
                let parsedDate;
                if (typeof createdAt.toDate !== 'undefined') {
                  parsedDate = createdAt.toDate();
                } else {
                  parsedDate = new Date(createdAt);
                }

                reviewItem.querySelector(".review-date .tiny-top-margin").innerText = `${monthNames[parsedDate.getMonth()]} ${parsedDate.getDate()} ${parsedDate.getFullYear()}`

                reviewsContainer.appendChild(reviewItem);
              });
            })
            .catch(error => {
              console.error(error);
            });
          } else {
            starsWrap.remove();
            
            const message = document.createElement("span");
            message.innerText = "No reviews for this product.";
            reviewsContainer.appendChild(message);
          }
        })
            
//       firebase.firestore().runTransaction((transaction) => {        
//       transaction.get(document).then((doc) => {
//         const data = doc.data();

//         const newAverage =
//           (data.numRatings * data.avgRating + rating.rating) /
//           (data.numRatings + 1);

//         transaction.update(document, {
//           numRatings: data.numRatings + 1,
//           avgRating: newAverage
//         });
        
//         transaction.set(newRatingDocument, rating);
//     });
      

      
      break;
  }
};
