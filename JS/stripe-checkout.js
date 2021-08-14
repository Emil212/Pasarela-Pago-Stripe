import stripeKeys from "./stripe-keys.js";

const d = document,
  $productos = d.getElementById("productos"),
  $template = d.getElementById("producto-template").content,
  $fragment = d.createDocumentFragment(),
  fetchOptions = {
    headers: {
      Authorization: `Bearer ${stripeKeys.secret}`,
    },
  };

let products, prices;

const moneyFormats = (num) => `$${num.slice(0, -2)}.${num.slice(-2)}`;

Promise.all([
  fetch("https://api.stripe.com/v1/products", fetchOptions),
  fetch("https://api.stripe.com/v1/prices", fetchOptions),
])
  .then((responses) => Promise.all(responses.map((res) => res.json())))
  .then((json) => {
    // console.log(json);
    products = json[0].data;
    prices = json[1].data;
    // console.log(products, prices);

    prices.forEach((el) => {
      let productData = products.filter((product) => product.id === el.product);
      // console.log(productData);

      $template.querySelector(".producto").setAttribute("data-price", el.id);
      $template.querySelector("img").src = productData[0].images[0];
      $template.querySelector("img").alt = productData[0].name;
      $template.querySelector("figcaption").innerHTML = `${productData[0].name}
      <br>
      ${moneyFormats(el.unit_amount_decimal)} ${el.currency}
      `;

      let $clone = d.importNode($template, true);
      $fragment.appendChild($clone);
    });

    $productos.appendChild($fragment);
  })
  .catch((err) => {
    // console.log(err);
    let message =
      err.statusText || "Ocurrio un error al conectarse a la API de Stripe";
    $productos.innerHTML = `<p> Error ${err.status}: ${message} </p>`;
  });

d.addEventListener("click", (e) => {
  console.log(e.target);
  //Para que al hacer click a todo los hijos de taco se active la alerta
  if (e.target.matches(".producto *")) {
    //para que se vaya al padre de donde se este dando click
    let priceid = e.target.parentElement.getAttribute("data-price");
    Stripe(stripeKeys.public)
      .redirectToCheckout({
        lineItems: [{ price: priceid, quantity: 1 }],
        mode: "payment",
        successUrl: "http://127.0.0.1:5500/stripe-success.html",
        cancelUrl: "http://127.0.0.1:5500/stripe-cancel.html",
      })
      .then((res) => {
        console.log(res);
        if (res.error) {
          $productos.insertAdjacentHTML("afterend", res.error.message);
        }
      });
  }
});

//El metodo promise all va a esperar a que le respondan cada uno de los endpoints
//El metodo map crea un array con el resultado de la llamada a la funcion
//El metodo filter crea un nuevo array con todos los elementos que cumplan la condicion implementada por la funcion dada
