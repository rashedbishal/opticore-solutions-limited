<?php

use App\Models\Brand;
use App\Models\Admin;

beforeEach(function () {
    $this->admin = Admin::factory()->create();
});

it('can list brands on the admin index', function () {
    Brand::create(['name' => 'Test Brand A']);

    $this->actingAs($this->admin, 'admin')
        ->get('/admin/brands')
        ->assertSuccessful();
});

it('can create a new brand', function () {
    $this->actingAs($this->admin, 'admin')
        ->post('/admin/brands', [
            'name' => 'Brand New Name',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('brands', [
        'name' => 'Brand New Name',
    ]);
});

it('can update an existing brand', function () {
    $brand = Brand::create(['name' => 'Old Name']);

    $this->actingAs($this->admin, 'admin')
        ->put('/admin/brands/'.$brand->id, [
            'name' => 'Updated Name',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('brands', [
        'id' => $brand->id,
        'name' => 'Updated Name',
    ]);
});

it('can delete a brand', function () {
    $brand = Brand::create(['name' => 'To Be Deleted']);

    $this->actingAs($this->admin, 'admin')
        ->delete('/admin/brands/'.$brand->id)
        ->assertRedirect();

    $this->assertDatabaseMissing('brands', [
        'id' => $brand->id,
    ]);
});

it('requires a unique name when creating a brand', function () {
    Brand::create(['name' => 'Duplicate Name']);

    $this->actingAs($this->admin, 'admin')
        ->post('/admin/brands', [
            'name' => 'Duplicate Name',
        ])
        ->assertInvalid(['name']);
});
