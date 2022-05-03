App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    // Load pets.
    $.getJSON("../products.json", function (data) {
      var productsRow = $("#productsRow");
      var productsTemplate = $("#productsTemplate");

      for (i = 0; i < data.length; i++) {
        productsTemplate
          .find(".panel-title")
          .text(data[i].title.substr(0, 26) + "...");
        productsTemplate.find("img").attr("src", data[i].image);
        productsTemplate
          .find(".product-description")
          .text(data[i].description.substr(0, 20) + "...");
        productsTemplate.find(".product-rating").text(data[i].rating.rate);
        productsTemplate.find(".product-category").text(data[i].category);
        productsTemplate
          .find(".product-price")
          .text((data[i].price / 100).toFixed(4));
        productsTemplate
          .find("button")
          .attr("data-id", data[i].id)
          .attr("data-price", data[i].price / 100);

        productsRow.append(productsTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (error) {
        // User denied account access...
        console.error("User denied account access");
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Adoption.json", function (data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });
    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on("click", ".btn-adopt", App.handleAdopt);
    $(document).on("click", ".btn-quick-sell", App.handleQuickSell);
  },

  markAdopted: function () {
    var adoptionInstance;

    App.contracts.Adoption.deployed()
      .then(function (instance) {
        adoptionInstance = instance;

        return adoptionInstance.getAdopters.call();
      })
      .then(function (adopters) {
        console.log(adopters);
        for (i = 0; i < adopters.length; i++) {
          if (adopters[i] !== "0x0000000000000000000000000000000000000000") {
            var adopterAddr =
              adopters[i].toString().substr(0, 5) +
              "................" +
              adopters[i].toString().substr(13, 4);
            $(".panel-pet")
              .eq(i)
              .find(".btn-adopt")
              .text(`Bought by ${adopterAddr}`)
              .attr("disabled", true);
          }
        }
      })
      .catch(function (err) {
        console.log(err.message);
      });
  },

  handleAdopt: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data("id"));
    var petPrice = parseFloat($(event.target).data("price"));
    console.log(petId, petPrice);
    var amountToSend = web3.toWei(petPrice.toString(), "ether");

    var adoptionInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed()
        .then(async function (instance) {
          adoptionInstance = instance;

          // Execute adopt as a transaction by sending account
          return adoptionInstance.adopt(petId, {
            from: account,
            value: amountToSend,
            gas: 50000,
          });
        })
        .then(function (result) {
          return App.markAdopted();
        })
        .catch(function (err) {
          console.log(err.message);
        });
    });
  },
  handleQuickSell: function (event) {
    event.preventDefault();
    var petId = parseInt($(event.target).data("id"));
    var petPrice = parseFloat($(event.target).data("price")) * 0.8;

    console.log(petId, petPrice);
    var amountToGet = web3.toWei(petPrice.toString(), "ether");

    var adoptionInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed()
        .then(async function (instance) {
          adoptionInstance = instance;

          // Execute adopt as a transaction by sending account
          return adoptionInstance.quickSell(petId, amountToGet, {
            from: account,
            gas: 50000,
          });
        })
        .then(function (result) {
          return App.markAdopted();
        })
        .catch(function (err) {
          console.log(err.message);
        });
    });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
