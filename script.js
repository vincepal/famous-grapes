window.user = null;

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function slugify(str)
{
    str = str.replace(/^\s+|\s+$/g, '');

    str = str.toLowerCase();

    var from = "ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;";
    var to   = "AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------";
    for (var i=0, l=from.length ; i<l ; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') 
    .replace(/\s+/g, '-') 
    .replace(/-+/g, '-'); 

    return str;
}


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
    case "your-account":
      if (!window.user) {
        window.location.replace("/sign-in");
      }

      const headingProfile = document.querySelector(".heading-2");      

      if (headingProfile) {
        headingProfile.innerText = `Welcome back, ${window.user.displayName}`;
        headingProfile.style.display = "flex";
      }
      
      const accountInfo = document.querySelectorAll(".paragraph")
            
      accountInfo[0].innerText = window.user.displayName;
          
      accountInfo[1].innerText = window.user.email;


      const profileRef = firebase
        .firestore()
        .collection("users")
        .doc(window.user.email);
      
      profileRef
        .get()
        .then(profileSnapshot => {
          if (profileSnapshot.exists) {
              const { dob } = profileSnapshot.data();              
            
             let parsedDate;
              if (typeof dob.toDate !== 'undefined') {
                parsedDate = dob.toDate();
              } else {
                parsedDate = new Date(dob);
              }
            
             const formattedDate = `${parsedDate.getUTCDate()}/${parsedDate.getUTCMonth()+1}/${parsedDate.getFullYear()}`

              accountInfo[2].innerText = formattedDate;
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
            
            alert(error.message);
          });          
        }
      });

      break;
    case "your-account":
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
      
      while(orderWrap.firstChild) {
        orderWrap.removeChild(orderWrap.firstChild);
      }

      const orderContainer = document.getElementById("right-container");
      
      while(orderContainer.firstChild) {
        orderContainer.removeChild(orderContainer.firstChild);
      }
      
      const ordersRef = firebase
        .firestore()
        .collection("users")
        .doc(firebase.auth().currentUser.email)
        .collection("orders")
        .orderBy("orderedAt", "desc");
      
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

            const newOrderWrapper = orderWrap.cloneNode(true);


            let orderedAtParsed;
            if (typeof orderedAt.toDate !== 'undefined') {
              orderedAtParsed = orderedAt.toDate();
            } else {
              orderedAtParsed = new Date(orderedAt);
            }
            

            const newOrderTop = orderTemplateTop.cloneNode(true);
            
            newOrderTop.querySelector(".date").innerText = `${orderedAtParsed.getUTCDate()}/${orderedAtParsed.getUTCMonth() + 1}/${orderedAtParsed.getFullYear()}`
            newOrderTop.querySelectorAll(".date")[1].innerText = total;

            
            newOrderWrapper.appendChild(newOrderTop);

            items.forEach(item => {
              const newOrderItem = orderItemTemplate.cloneNode(true);
              newOrderItem.querySelector(".button.full.w-button").href = `/product/${item.slug}`
              newOrderItem.querySelector(".review.w-button").addEventListener("click", () => handleItemReviewClick(item.slug))
              
              if (item.thumbnail) {
                newOrderItem.querySelector(".checkout-thumbnail").src = item.thumbnail;
              } else {
                newOrderItem.querySelector(".checkout-thumbnail").style.display = "none";            
              }
              
              newOrderItem.querySelector(".product-name").innerText = item.name;
              newOrderItem.querySelector(".product-price-text.smaller").innerText = `$ ${item.price}`;
              newOrderItem.querySelector(".quantity.tiny-left-margin").innerText = item.quantity;
              newOrderWrapper.appendChild(newOrderItem);
            });
            
            newOrderWrapper.style.display = "flex";
              orderContainer.appendChild(newOrderWrapper);
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
        
        reviewModal.querySelector("#review-title").value = "";
        reviewModal.querySelector("#review-content").value = "";
        reviewModal.querySelector(".w-form-done").style.display = "none";
        
        
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
        const formDone = reviewModal.querySelector(".w-form-done");
        const formFail = reviewModal.querySelector(".w-form-fail");
        
        if (!window.currentReviewRating) {            
            formFail.style.display = "flex";
        }
        
        
        firebase.firestore().runTransaction((transaction) => {
          return transaction.get(document).then((doc) => {
            if (doc.exists) {      
               const data = doc.data();
                  
               if (data.numReviews && data.avgRating) {
                 const newAverage =  (data.numReviews * data.avgRating + window.currentReviewRating) / (data.numReviews + 1);

                 transaction.update(document, {
                    numReviews: data.numReviews + 1,
                    avgRating: newAverage
                 });                 
               } else {
                transaction.set(document, {
                  numReviews: 1,
                  avgRating: window.currentReviewRating
                });                 
               }
              
            } else {                          
              transaction.set(document, {
                numReviews: 1,
                avgRating: window.currentReviewRating
              });

            }
            
            transaction.set(newReviewDocument, {
              title, 
              content,
              createdAt: firebase.firestore.Timestamp.fromDate(
            new Date()
          ).toMillis(),
              rating: window.currentReviewRating
            });
          })
        })
                
        formDone.style.display = "flex";
      
        title.value = "";
        content.value = "";
        makeAllEmpty();
        
        reviewModal.removeEventListener("submit", handleReviewModalFormSubmit);        
      }
      break;
    // case "checkout":
    case "order-confirmation":
      if (window.user) {

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
          const thumbnail = el.querySelector(".checkout-thumbnail")
          const name = el.querySelector("#product-name").innerText;
          const quantity = el.querySelector("#product-quantity").innerText;
          const price = el.querySelector("#product-price").innerText.replace("CA$", "").trim();


          let slug = slugify(name);

          let orderItem = {
            name,
            slug,
            price,
            quantity,
          }

          if (thumbnail) {
            orderItem['thumbnail'] = thumbnail.src
          }

          orderItems.push(orderItem);
        });

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
          const days = new Date(selectYear.value, e.target.value - 1, 0).getDate();

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
              .doc(currentUser.email)
              .set({
                 email: currentUser.email,
                 firstName,
                 lastName,
                 dob: firebase.firestore.Timestamp.fromDate(new Date(
                  selectYear.value,
                  selectMonth.value - 1,
                  selectDay.value
                )),
                createdAt: firebase.firestore.Timestamp.fromDate(new Date())
              });

            // await currentUser.sendEmailVerification();
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

            const top = starsWrap;
            
            const reviewHeader = top.querySelector(".review-big").cloneNode(true);
            reviewHeader.innerText = Math.round(avgRating);
            
            const totalReviews = top.querySelector(".total-reviews").cloneNode(true);
            totalReviews.innerText = `(${numReviews} reviews)`
            
            const STAR = top.querySelector(".icon.review-star").cloneNode(true);
            const EMPTY = STAR.cloneNode(true);
            
            EMPTY.classList.remove("full");
            EMPTY.classList.add("empty");
            
            while(top.firstChild) {
              top.removeChild(top.firstChild);
            }
            
            top.appendChild(reviewHeader);
            
            if (avgRating >= 5) {
              top.appendChild(STAR.cloneNode(true));
              top.appendChild(STAR.cloneNode(true));
              top.appendChild(STAR.cloneNode(true));
              top.appendChild(STAR.cloneNode(true));
              top.appendChild(STAR.cloneNode(true));
            } else if (avgRating >= 4) {              
              top.appendChild(STAR.cloneNode(true));
              top.appendChild(STAR.cloneNode(true));
              top.appendChild(STAR.cloneNode(true));
              top.appendChild(STAR.cloneNode(true));
              top.appendChild(EMPTY.cloneNode(true));
            } else if (avgRating >= 3) {
              top.appendChild(STAR.cloneNode(true));
              top.appendChild(STAR.cloneNode(true));
              top.appendChild(STAR.cloneNode(true));
              top.appendChild(EMPTY.cloneNode(true));
              top.appendChild(EMPTY.cloneNode(true));
            } else if (avgRating >= 2){
              top.appendChild(STAR.cloneNode(true));
              top.appendChild(STAR.cloneNode(true));
              top.appendChild(EMPTY.cloneNode(true));
              top.appendChild(EMPTY.cloneNode(true));
              top.appendChild(EMPTY.cloneNode(true));
            } else {
              top.appendChild(STAR.cloneNode(true));
              top.appendChild(EMPTY.cloneNode(true));
              top.appendChild(EMPTY.cloneNode(true));
              top.appendChild(EMPTY.cloneNode(true));
              top.appendChild(EMPTY.cloneNode(true));
            }
            
            top.appendChild(totalReviews);
            reviewsContainer.appendChild(top);
            
            const firstReviews = reviewsRef.orderBy("createdAt")
                                            .limit(5);
            
             reviewsContainer.style.display = "block";
            
            let nextReviews;
            let lastVisible;
            
            firstReviews.get()
                .then((reviewSnapshot) => {                              
                  if (!reviewSnapshot.docs.length) {
                    const message = document.createElement("span");
                    message.innerText = "No reviews for this product.";
                    reviewsContainer.appendChild(message);
                    return
                  }

                  lastVisible = reviewSnapshot.docs[reviewSnapshot.docs.length-1];              
                  nextReviews = reviewsRef.orderBy("createdAt").startAfter(lastVisible).limit(5);                                 
              
                  reviewSnapshot.docs.forEach(doc => {            
                      const { title, content, rating, createdAt} = doc.data();
                      const reviewItem = reviewWrap.cloneNode(true);
                      const starsTitle = reviewItem.querySelector(".stars-title").cloneNode(true); 
                      const reviewTitle = starsTitle.querySelector(".review-title").cloneNode(true);
                    
                    
                      const STAR = starsTitle.querySelector(".icon.review-star").cloneNode(true);
                      const EMPTY = STAR.cloneNode(true);
                    
                      EMPTY.classList.remove("full");
                      EMPTY.classList.add("empty");
                    
                    
                      while(starsTitle.firstChild) {
                        starsTitle.removeChild(starsTitle.firstChild);
                      }
                                        
                    
                      const reviewComment = reviewItem.querySelector(".review-comment").cloneNode(true);                                          
                      reviewComment.innerText = content;
                      const reviewDate = reviewItem.querySelector(".review-date").cloneNode(true);
                    
                      while(reviewItem.firstChild) {
                        reviewItem.removeChild(reviewItem.firstChild);
                      }
                    
                     
                    
                      reviewTitle.innerText = title;
                      starsTitle.appendChild(reviewTitle);
                      
                      // reviewItem.querySelector(".review-star.empty").remove();
                    
                      switch (rating) {
                        case 5:
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          break;
                        case 4:
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          break;
                        case 3:
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          break;
                        case 2:
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          break;
                        case 1:
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          break
                      }
                    
                      reviewTitle.innerText = title;
                      
                      starsTitle.appendChild(reviewTitle);
                    
                      reviewItem.appendChild(starsTitle);
                    
                      
                      let parsedDate;
                      if (typeof createdAt.toDate !== 'undefined') {
                         parsedDate = createdAt.toDate();
                      } else {
                         parsedDate = new Date(createdAt);
                      }
                    
                      reviewDate.querySelector(".tiny-top-margin").innerText = `${monthNames[parsedDate.getMonth()]} ${parsedDate.getDate()} ${parsedDate.getFullYear()}`                      
                      reviewItem.appendChild(reviewDate);

                      reviewItem.appendChild(reviewComment);

                      reviewsContainer.appendChild(reviewItem);
                  })
              
                seemore.addEventListener("click", () => loadMoreReviews());
              
                reviewsContainer.appendChild(seemore);
                             
            });
            
            function loadMoreReviews() {
              
              const next = seemore.cloneNode(true);
              seemore.remove();
              
              nextReviews.get()
                            .then((nextSnapshot) => {
                                nextSnapshot.docs.forEach(doc => {            
                                  
                                  let lastVisible = nextSnapshot.docs[nextSnapshot.docs.length-1];              
                                  nextReviews = reviewsRef.orderBy("createdAt").startAfter(lastVisible).limit(5); 

                   const { title, content, rating, createdAt} = doc.data();
                      const reviewItem = reviewWrap.cloneNode(true);
                      const starsTitle = reviewItem.querySelector(".stars-title").cloneNode(true); 
                      const reviewTitle = starsTitle.querySelector(".review-title").cloneNode(true);
                    
                    
                      const STAR = starsTitle.querySelector(".icon.review-star").cloneNode(true);
                      const EMPTY = STAR.cloneNode(true);
                    
                      EMPTY.classList.remove("full");
                      EMPTY.classList.add("empty");
                    
                    
                      while(starsTitle.firstChild) {
                        starsTitle.removeChild(starsTitle.firstChild);
                      }
                                        
                    
                      const reviewComment = reviewItem.querySelector(".review-comment").cloneNode(true);                                          
                      reviewComment.innerText = content;
                      const reviewDate = reviewItem.querySelector(".review-date").cloneNode(true);
                    
                      while(reviewItem.firstChild) {
                        reviewItem.removeChild(reviewItem.firstChild);
                      }
                    
                     
                    
                      reviewTitle.innerText = title;
                      starsTitle.appendChild(reviewTitle);
                      

                                  switch (rating) {
                        case 5:
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          break;
                        case 4:
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          break;
                        case 3:
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          break;
                        case 2:
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          break;
                        case 1:
                          starsTitle.appendChild(STAR.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          starsTitle.appendChild(EMPTY.cloneNode(true))
                          break
                      }

                                  reviewTitle.innerText = title;

                                  starsTitle.appendChild(reviewTitle);

                                  reviewItem.appendChild(starsTitle);


                                  let parsedDate;
                                  if (typeof createdAt.toDate !== 'undefined') {
                                     parsedDate = createdAt.toDate();
                                  } else {
                                     parsedDate = new Date(createdAt);
                                  }

                                  reviewDate.querySelector(".tiny-top-margin").innerText = `${monthNames[parsedDate.getMonth()]} ${parsedDate.getDate()} ${parsedDate.getFullYear()}`                      
                                  reviewItem.appendChild(reviewDate);

                                  reviewItem.appendChild(reviewComment);

                                  reviewsContainer.appendChild(reviewItem);
                                  
                              })
                                              seemore.addEventListener("click", () => loadMoreReviews());              
                reviewsContainer.appendChild(seemore);

                            })              
            }
          } else {
            starsWrap.remove();
            
            const message = document.createElement("span");
            message.innerText = "No reviews for this product.";
            reviewsContainer.appendChild(message);
            reviewsContainer.style.display = "block";
          }                
        })
                  
      break;
  }
};
